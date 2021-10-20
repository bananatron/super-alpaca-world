import Vue from 'vue/dist/vue.js';
import $ from 'cash-dom';
import { Game } from './game';
import { getDatabase, ref, onValue, update, push, remove } from "firebase/database";

export const UI = {
  start: () => {
    new Vue({
      el: '#app-viewport',
      created: function () {
        this.startFirebaseChatListener();
      },
      mounted: function() {
        document.querySelector('#form-name-input').addEventListener('keypress', (event) => {
          if (event.key !== 'Enter') return;

          this.submitNameForm();
        });
      },
      data: {
        name: window.localStorage.getItem('name') || '',
        name_form_complete: false,
        alpaca_color: 'blue',

        chat_input: '',
        chat_hidden: false,
        chat_messages: {},
        command_warning: '',
      },
      methods: {
        submitNameForm: function() {
          if (!this.name || this.name === '') { console.error('no name whoops'); return; }

          if (!window.localStorage.getItem('id')) {
            window.localStorage.setItem('id', Math.round(Math.random() * 99999999999999))
          }
          window.localStorage.setItem('name', this.name);
          window.localStorage.setItem('alpaca_color', this.alpaca_color);
          this.name_form_complete = true;

          this.registerWithFirebase();
          Game.start();
        },
        registerWithFirebase: function() {
          const db = getDatabase();
          const id = window.localStorage.getItem('id');
          const name = window.localStorage.getItem('name');
          const alpaca_color = window.localStorage.getItem('alpaca_color');

          if (!id || !name || !alpaca_color) {
            console.error("Whoah man, you don't have all the goodies to register with Firebase")
          }
          
          update(ref(db, `users/${id}`), {
            id: id,
            name: name,
            alpaca_color : alpaca_color
          });
        },

        sendChatCommand: function() {
          this.command_warning = 'Not a valid chat command. Try /help for more, dare I say, HELP'

          if (this.chat_input.includes('/help')) {
            this.command_warning = 'Valid commands are /plantsign <sign text> && /plantstone && /plantclear'
          }

          if (this.chat_input.includes('/plantclear')) {
            this.sendClearPlayerObjects();
            this.command_warning = "Signs cleared."
          }

          if (this.chat_input.includes('/plantsign')) {
            const text = this.chat_input.split(' ').slice(1, 99).join(' ')

            if (!text || text == '') {
              this.command_warning = "/plantsign <sign text> is required"
              return;
            }

            this.command_warning = "Aye aye, cap'n! Clear all planted objects with /plantclear"
            this.sendPlantSign(text);
          }

          if (this.chat_input.includes('/plantstone')) {
            this.command_warning = "Aye, that's a nice stone! Clear all planted objects with /plantclear"
            this.sendPlantStone();
          }

          if (this.chat_input.includes('/planttree')) {
            this.command_warning = "Wowee, that's a happy little tree friend! Clear all planted objects with /plantclear"
            this.sendPlantTree();
          }

          this.chat_input = '';

          setTimeout(() => {
            this.command_warning = '';
          }, 8000)
          return;
        },

        sendClearPlayerObjects: function() {
          const db = getDatabase();
          remove(ref(db, `objects/${window.localStorage.getItem('id')}`));
        },

        sendPlantSign: function(text) {
          if (!window.localStorage.getItem('x') || !window.localStorage.getItem('y')) {
            console.error('Whoah! No X or Y for sendPlantSign!'); return;
          }

          const db = getDatabase();
          push(ref(db, `objects/${window.localStorage.getItem('id')}`), {
            type: 'sign',
            text: text,
            x: window.localStorage.getItem('x'),
            y: window.localStorage.getItem('y'),
            author: window.localStorage.getItem('name'),
          });
        },

        sendPlantStone: function() {
          if (!window.localStorage.getItem('x') || !window.localStorage.getItem('y')) {
            console.error('Whoah! No X or Y for sendPlantStone!'); return;
          }

          const db = getDatabase();
          push(ref(db, `objects/${window.localStorage.getItem('id')}`), {
            type: 'stone',
            x: window.localStorage.getItem('x'),
            y: window.localStorage.getItem('y'),
            author: window.localStorage.getItem('name'),
          });
        },

        sendPlantTree: function() {
          if (!window.localStorage.getItem('x') || !window.localStorage.getItem('y')) {
            console.error('Whoah! No X or Y for sendPlantTree!'); return;
          }

          const db = getDatabase();
          push(ref(db, `objects/${window.localStorage.getItem('id')}`), {
            type: 'tree',
            x: window.localStorage.getItem('x'),
            y: window.localStorage.getItem('y'),
            author: window.localStorage.getItem('name'),
          });
        },

        sendChatMessage: function() {
          if (/^\s*$/.test(this.chat_input)) { this.chat_input = ''; return; }

          // If we're sending a chat command
          if (this.chat_input.includes('/')) {
            this.sendChatCommand(this.chatInput);
            return;
          };

          const db = getDatabase();
          push(ref(db, `chat_messages`), {
            author: window.localStorage.getItem('name'),
            message: this.chat_input,
          });
          this.chat_input = '';
        },

        deleteChatMessage: function(messageId) {
          const db = getDatabase();
          remove(ref(db, `chat_messages/${messageId}`));
        },

        startFirebaseChatListener: function() {
          const db = getDatabase();
          const chat_messages = ref(db, `chat_messages`);

          onValue(chat_messages, (snapshot) => {
            // Just reset entire message set, vue will reflow gracefully
            this.chat_messages = snapshot.val();
            const $chatMessageList = $('.chat-viewport ul')[0]
            setTimeout(() => {
              $chatMessageList.scrollTop = $chatMessageList.scrollHeight - $chatMessageList.clientHeight + 600;
            }, 100)
          });
        }
      },

    })
  }
}
