import Phaser from 'phaser'
import $ from 'cash-dom';
import { getDatabase, ref, onValue, update} from "firebase/database";

import alpacaRunSpritesheet from '../assets/sprites/alpaca-run-1.png';
import crybabyFountain from '../assets/sprites/crybaby-fountain.png';
import sign from '../assets/sprites/sign.png';
import stones from '../assets/sprites/stones.png';
import trees from '../assets/sprites/trees.png';
import grassBackround from '../assets/bg/grass.png';

class MainScene extends Phaser.Scene {
  COLORMAP = {
    'yellow': 0xffcc00,
    'purple': 0x8E7CC3,
    'blue': 0xFFFFFF,
    'green': 0x93C47D,
    'pink': 0xFF68CC,
  }
  CAMERA_ZOOM = 1
  SPRITE_SCALE = 2;
  ALPACA_MOVESPEED = 90;
  STOP_TOLERANCE = 3;
  DEFAULT_START_LOCATION = 200;
  LERP = 0.05
  BG_TILE_SIZE = 768;
  WORLD_SIZE = this.BG_TILE_SIZE * 4;

  db = getDatabase();
  target = new Phaser.Math.Vector2();
  alpaca_group = null;

  // Filled with sprite objects as firebase connects
  game_alpacas = {} 
  game_objects = {}

  startAlpacaListener() {
    const users = ref(this.db, `users`);

    onValue(users, (snapshot) => {
      const alpacaSnapshot = snapshot.val();
      if (!alpacaSnapshot) return;

      Object.keys(alpacaSnapshot).forEach((key) => {
        const alpacaData = alpacaSnapshot[key];

        this.upsertAlpacaSprite(
          alpacaData.id,
          alpacaData.name,
          alpacaData.alpaca_color,
          alpacaData.x || Math.random() * 100 + this.DEFAULT_START_LOCATION,
          alpacaData.y || Math.random() * 100 + this.DEFAULT_START_LOCATION,
        )
      })
    });
  }

  startObjectListener() {
    const objects = ref(this.db, `objects`);

    onValue(objects, (snapshot) => {
      const objectSnapshot = snapshot.val();
      if (!objectSnapshot) return;

      // Destroy all objects before they're replaced
      this.destroyAllObjects();

      // Players have stores of objects
      Object.keys(objectSnapshot).forEach((key) => {
        const playerObjectsData = objectSnapshot[key];
        if (!playerObjectsData) return;

        // Each player store
        Object.keys(playerObjectsData).forEach((objKey) => {
          const objData = playerObjectsData[objKey];
          if (!objData) return;

          if (objData.type == 'sign') {
            this.drawSign(objKey, objData.x, objData.y, objData.text);
          }

          if (objData.type == 'stone') this.drawStone(objKey, objData.x, objData.y);
          if (objData.type == 'tree') this.drawTree(objKey, objData.x, objData.y);
        })

      })
    });
  }

  upsertAlpacaSprite(id, name, color, x, y) {
    if (this.game_alpacas[id]) {
      this.updateAlpacaSprite(id, x, y)
    } else {
      this.setupAlpacaSprite(id, name, color, x, y)
    }
  }

  updateAlpacaSprite(id, x, y) {
    if (!id || !x || !y) return;

    let target = this.game_alpacas[id].target
    target.x = x; target.y = y;

    // Don't restart animation if already running
    if (this.game_alpacas[id].sprite.anims.currentAnim.key != 'run') {
      this.game_alpacas[id].sprite.play({key: 'run'})
    }

    this.physics.moveToObject(this.game_alpacas[id].sprite, target, this.ALPACA_MOVESPEED);
  }

  setupAlpacaSprite(id, name, color, x, y) {
    if (this.game_alpacas[id]) return;

    // Setup meta
    this.game_alpacas[id] = {};
    this.game_alpacas[id].meta = {
      name: name,
      color: color
    };

    // Setup sprite
    this.game_alpacas[id].sprite = this.physics.add.sprite(x, y, 'alpacaRun');
    this.game_alpacas[id].sprite.setOrigin(0.5, 0.9);
    this.game_alpacas[id].sprite.setScale(this.SPRITE_SCALE);
    this.game_alpacas[id].sprite.play({key: 'idle'});
    this.game_alpacas[id].sprite.tint = this.COLORMAP[color];
    this.game_alpacas[id].sprite.body.collideWorldBounds = true;
    this.alpaca_group.add(this.game_alpacas[id].sprite);

    // Setup target
    this.game_alpacas[id].target = new Phaser.Math.Vector2();

    // Setup UI text
    this.game_alpacas[id].ui_text = this.add.text(0, 0, name, { fontFamily: 'monospace', fontSize: 12, resolution: 2, color: 'black'});
    // https://photonstorm.github.io/phaser3-docs/Phaser.Types.GameObjects.Text.html#.TextStyle

    // IF this is your alpaca, follow w/ camera
    if (window.localStorage.getItem('id') == id) {
      this.cameras.main.startFollow(this.game_alpacas[id].sprite, false, this.LERP, this.LERP);
    }
  }

  loadAnimations() {
    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('alpacaRun'),
      frameRate: 9,
      repeat: -1
    });

    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('alpacaRun', { frames: [ 0 ] }),
      frameRate: 0,
      repeat: -1
    });

    this.anims.create({
      key: 'crybabyFountainFlow',
      frames: this.anims.generateFrameNumbers('crybabyFountain'),
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: 'tree0',
      frames: this.anims.generateFrameNumbers('trees', { frames: [ 0 ] }),
      frameRate: 0,
      repeat: 0,
    });
    this.anims.create({
      key: 'tree1',
      frames: this.anims.generateFrameNumbers('trees', { frames: [ 1 ] }),
      frameRate: 0,
      repeat: 0,
    });
    this.anims.create({
      key: 'tree2',
      frames: this.anims.generateFrameNumbers('trees', { frames: [ 2 ] }),
      frameRate: 0,
      repeat: 0,
    });
    this.anims.create({
      key: 'tree3',
      frames: this.anims.generateFrameNumbers('trees', { frames: [ 3 ] }),
      frameRate: 0,
      repeat: 0,
    });
    this.anims.create({
      key: 'tree4',
      frames: this.anims.generateFrameNumbers('trees', { frames: [ 4 ] }),
      frameRate: 0,
      repeat: 0,
    });
    this.anims.create({
      key: 'tree5',
      frames: this.anims.generateFrameNumbers('trees', { frames: [ 5 ] }),
      frameRate: 0,
      repeat: 0,
    });

    this.anims.create({
      key: 'stone0',
      frames: this.anims.generateFrameNumbers('stones', { frames: [ 0 ] }),
      frameRate: 0,
      repeat: 0,
    });
    this.anims.create({
      key: 'stone1',
      frames: this.anims.generateFrameNumbers('stones', { frames: [ 1 ] }),
      frameRate: 0,
      repeat: 0,
    });
    this.anims.create({
      key: 'stone2',
      frames: this.anims.generateFrameNumbers('stones', { frames: [ 2 ] }),
      frameRate: 0,
      repeat: 0,
    });
    this.anims.create({
      key: 'stone3',
      frames: this.anims.generateFrameNumbers('stones', { frames: [ 3 ] }),
      frameRate: 0,
      repeat: 0,
    });
    this.anims.create({
      key: 'stone4',
      frames: this.anims.generateFrameNumbers('stones', { frames: [ 4 ] }),
      frameRate: 0,
      repeat: 0,
    });
    this.anims.create({
      key: 'stone5',
      frames: this.anims.generateFrameNumbers('stones', { frames: [ 5 ] }),
      frameRate: 0,
      repeat: 0,
    });
    this.anims.create({
      key: 'stone6',
      frames: this.anims.generateFrameNumbers('stones', { frames: [ 6 ] }),
      frameRate: 0,
      repeat: 0,
    });
  }

  submitMoveLocation(pointer) {
    const id = window.localStorage.getItem('id');
    const x = (this.cameras.main.worldView.x) + (pointer.x / this.CAMERA_ZOOM)
    const y = (this.cameras.main.worldView.y) + (pointer.y / this.CAMERA_ZOOM)

    // Set new location @ firebase
    // (then movement will happen in response to DB change)
    update(ref(this.db, `users/${id}`), {
      x: x, y: y
    });

    // Set localstorage
    window.localStorage.setItem('x', x)
    window.localStorage.setItem('y', y)
  }

  setupControlListener() {
    // On click
    this.input.on('pointerdown', function (pointer) {
      this.submitMoveLocation(pointer);

      setInterval(() => {
        if (this.input.activePointer.isDown) {
          if (this.input.activePointer.downElement.tagName != 'CANVAS') return; // Don't submit movement if cursor is in chat

          this.submitMoveLocation(this.input.activePointer.event);
        }
      }, 500)
    }, this);
  }

  constructor () {
    super();
  }

  preload() {
    this.load.spritesheet(
      'alpacaRun',
      alpacaRunSpritesheet,
      { frameWidth: 64, frameHeight: 64 }
    );

    this.load.spritesheet(
      'crybabyFountain',
      crybabyFountain,
      { frameWidth: 64, frameHeight: 64 }
    );

    this.load.spritesheet(
      'trees',
      trees,
      { frameWidth: 64, frameHeight: 64 }
    );

    this.load.spritesheet(
      'stones',
      stones,
      { frameWidth: 64, frameHeight: 64 }
    );

    this.load.spritesheet(
      'sign',
      sign,
      { frameWidth: 64, frameHeight: 64 }
    );

    this.load.image('grass', grassBackround);

    this.alpaca_group = this.physics.add.group({
      key: 'alpaca_group',
      frameQuantity: 30
    });
  }

  setupEnvironmentObjects() {
    // CRYBABY FOUNTAIN WILL GRAND A WISH WIHTH EVERY TEAR ⛲️😭
    const fountain = this.physics.add.sprite(2800, 300, 'crybabyFountain');
    fountain.setScale(this.SPRITE_SCALE);
    fountain.play({key: 'crybabyFountainFlow'})
    fountain.body.immovable = true;
    fountain.setDepth(fountain.y);
    fountain.setOrigin(0.5, 0.9);
  }

  destroyAllObjects() {
    Object.keys(this.game_objects).forEach((objKey) => {
      const gameObject = this.game_objects[objKey];
      if (gameObject.sprite) gameObject.sprite.destroy();
      if (gameObject.text) gameObject.text.destroy();
      delete this.game_objects[objKey];
    })
  }

  drawTree(id, x, y) {
    this.game_objects[id] = {}

    const tree = this.physics.add.sprite(parseInt(x), parseInt(y), 'trees');
    tree.setScale(this.SPRITE_SCALE);
    tree.play({key: `tree${Math.floor(Math.random() * 5).toString()}`})
    tree.body.immovable = true;
    tree.setOrigin(0.5, 0.9);
    tree.setDepth(tree.y);

    this.game_objects[id].sprite = tree; // Set it to global store
  }

  drawStone(id, x, y) {
    this.game_objects[id] = {}

    const stone = this.physics.add.sprite(parseInt(x), parseInt(y), 'stones');
    stone.setScale(this.SPRITE_SCALE);
    stone.play({key: `stone${Math.floor(Math.random() * 7).toString()}`})
    stone.body.immovable = true;

    this.game_objects[id].sprite = stone; // Set it to global store
  }

  drawSign(id, x, y, text) {
    this.game_objects[id] = {}

    // Draw sign graphic
    const sign = this.physics.add.sprite(parseInt(x), parseInt(y), 'sign');
    sign.setScale(this.SPRITE_SCALE);
    sign.body.immovable = true;
    sign.setDepth(sign.y);
    sign.setOrigin(0.5, 0.9);

    // Add text to sign
    const textObj = this.add.text(sign.x - 30, sign.y - 55, text.substring(0, 5), { fontFamily: 'monospace', fontSize: 22, resolution: 2, color: 'black' });
    textObj.setDepth(sign.y+1)

    // Set it to global store
    this.game_objects[id].sprite = sign;
    this.game_objects[id].text = textObj;
  }

  startFirebaseListener() {
    this.startObjectListener();
    this.startAlpacaListener();
  }

  create() {
    // Add scene stuff
    this.loadAnimations();
    this.add.tileSprite(0, 0, this.WORLD_SIZE * 2, this.WORLD_SIZE * 2, "grass");
    this.setupEnvironmentObjects();

    // Setup camera
    this.cameras.main.setBounds(0, 0, this.WORLD_SIZE, this.WORLD_SIZE);
    this.cameras.main.setZoom(this.CAMERA_ZOOM);
    this.cameras.main.backgroundColor = Phaser.Display.Color.HexStringToColor("#vvvvvv");

    
    this.startFirebaseListener(); // Load alpacas
    this.setupControlListener(); // Setup controls
  }

  update() {
    Object.keys(this.game_alpacas).forEach((id) => {
      const alpaca = this.game_alpacas[id]

      if (alpaca.sprite.body.speed > 0) {
        alpaca.ui_text.x = alpaca.sprite.x;
        alpaca.ui_text.y = alpaca.sprite.y - 90;

        var distance = Phaser.Math.Distance.Between(
          alpaca.sprite.x,
          alpaca.sprite.y,
          alpaca.target.x,
          alpaca.target.y);

        if (distance < this.STOP_TOLERANCE) {
            alpaca.sprite.body.reset(alpaca.sprite.x, alpaca.sprite.y);
            alpaca.sprite.play({key: 'idle'})
        } else {
          // Flip sprite to orientation if running
          if (alpaca.target.x > alpaca.sprite.x) {
            alpaca.sprite.flipX = true;
          } else {
            alpaca.sprite.flipX = false;
          }
        }
      }

      // Depth sort lol (z-index)
      alpaca.sprite.setDepth(alpaca.sprite.y);
      alpaca.ui_text.setDepth(alpaca.sprite.y);
    })
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-viewport',
  physics: {
      default: 'arcade'
  },
  backgroundColor: '#4488aa',
  pixelArt: true,
  scene: [MainScene]
};


export const Game = {
  start: () => {
    $('#game-viewport').removeClass('dn')
    new Phaser.Game(config);
  }
}
