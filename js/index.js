// create a new instance of ChatEngine
ChatEngine = ChatEngineCore.create({
    publishKey: 'YOUR-PUBLISH-KEY',
    subscribeKey: 'YOUR-SUBSCRIBE-KEY'
});
// use a helper function to generate a new profile
let newPerson = generatePerson(true);

// create a bucket to store our ChatEngine Chat object
let myChat;

// create a bucket to store 
let me;

// compile handlebars templates and store them for use later
let peopleTemplate = Handlebars.compile($("#person-template").html());
let meTemplate = Handlebars.compile($("#message-template").html());
let userTemplate = Handlebars.compile($("#message-response-template").html());

// create an optional config object to increase the default timeout from 1000ms
let config = { timeout: 2000 };
// let keypress = function () {};
// let keynotpress = function () {};

// this is our main function that starts our chat app
const init = () => {
  
  // connect to ChatEngine with our generated user
  ChatEngine.connect(newPerson.uuid, newPerson);

  // when ChatEngine is booted, it returns your new User as `data.me`
  ChatEngine.on('$.ready', function(data) {
		
      // store my new user as `me`
      me = data.me;

      // create a new ChatEngine Chat
			myChat = new ChatEngine.Chat('chatengine-demo-typing');
			
			// start of Typing indicator plugin
			// -----------------------------------
			myChat.plugin(ChatEngineCore.plugin['chat-engine-typing-indicator'](config));

			document.addEventListener("keydown", keypress);
			document.addEventListener("keyup", keynotpress);

			myChat.on('$typingIndicator.startTyping', (payload) => {
				$('#typing').html(payload.sender.state.first + " is typing...");
			});

			myChat.on('$typingIndicator.stopTyping', (payload) => {
				$('#typing').empty();
			});

			// end of typing indicator plugin
			// -----------------------------------

      // when we recieve messages in this chat, render them
      myChat.on('message', (message) => {
          renderMessage(message);
      });

      // when a user comes online, render them in the online list
      myChat.on('$.online.*', (data) => {   
        $('#people-list ul').append(peopleTemplate(data.user));
      });

      // when a user goes offline, remove them from the online list
      myChat.on('$.offline.*', (data) => {
        $('#people-list ul').find('#' + data.user.uuid).remove();
      });

      // wait for our chat to be connected to the internet
      myChat.on('$.connected', () => {

          // search for 50 old `message` events
          myChat.search({
            event: 'message',
            limit: 50
          }).on('message', (data) => {
            
            // console.log(data)
            
            // when messages are returned, render them like normal messages
            renderMessage(data, true);
            
          });
        
			});

  });

};

// send a message to the Chat
const sendMessage = () => {

    // get the message text from the text input
    let message = $('#message-to-send').val().trim();
  
    // if the message isn't empty
    if (message.length) {
      
        // emit the `message` event to everyone in the Chat
        myChat.emit('message', {
            text: message
        });

        // clear out the text input
        $('#message-to-send').val('');
    }
    
    // stop form submit from bubbling
    return false;
  
};

// render messages in the list
const renderMessage = (message, isHistory = false) => {

    // use the generic user template by default
    let template = userTemplate;

    // if I happened to send the message, use the special template for myself
    if (message.sender.uuid == me.uuid) {
        template = meTemplate;
    }

    let el = template({
        messageOutput: message.data.text,
        time: getCurrentTime(),
        user: message.sender.state
    });
  
    // render the message
    if(isHistory) {
      $('.chat-history ul').prepend(el); 
    } else {
      $('.chat-history ul').append(el); 
    }
  
    // scroll to the bottom of the chat
    scrollToBottom();

};

// scroll to the bottom of the window
const scrollToBottom = () => {
    $('.chat-history').scrollTop($('.chat-history')[0].scrollHeight);
};

// get the current time in a nice format
const getCurrentTime = () => {
    return new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
};

let keypress = (e) => {
	if (e.keyCode === 13) {
		// bind our "send" button and return key to send message
		$('#sendMessage').on('submit', sendMessage)		
	} else {
		myChat.typingIndicator.startTyping();
	}
};

let keynotpress = (e) => {
	myChat.typingIndicator.stopTyping();
};

// boot the app
init();