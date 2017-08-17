'use strict';

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            //type: 'PlainText',
            //text: output,
            "type": "SSML",
            "ssml": "<speak>"+output+"</speak>",
        },
        card: {
            type: 'Simple',
            title: `${title}`,
            content: `${stripCodeReferences(output)}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}


function stripCodeReferences(inputWithCode){
  let output = inputWithCode.replace(/\s*\<break[^>]*\>/g, `. `); //IGNORE ERROR IN LAMBDA
  return output;
}


function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}

function buildSpeechletResponseWithDirectiveNoIntent() {
    console.log("in buildSpeechletResponseWithDirectiveNoIntent");
    return {
      "outputSpeech" : null,
      "card" : null,
      "directives" : [ {
        "type" : "Dialog.Delegate"
      } ],
      "reprompt" : null,
      "shouldEndSession" : false
    };
  }

// --------------- Functions that control the skill's behavior -----------------------

//CALEB
function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    let sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to Counting Cards V 2. ' +
        'To Begin a new game say Start Game. For game instructions say Instructions';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please say Start Game or Instructions.';
    const shouldEndSession = false;

    sessionAttributes = initializeSessionAttributes();

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//CALEB
function initializeSessionAttributes(){
  return {
    state:'lobby',
    count:0,
    difficulty:0,
    streeks:0,
    decks:0,
    cards:['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Jack','Queen','King'],
    left:[0,0,0,0,0,0,0,0,0,0,0,0,0],
    value:[-1,1,1,1,1,1,0,0,0,-1,-1,-1,-1],
  };
}


function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for playing counting cards.';//' <prosody pitch="+50%">I </prosody> <prosody pitch="+20%">will </prosody><prosody pitch="-5%">See </prosody><prosody pitch="-15%">you </prosody><prosody pitch="-33%">later</prosody>';  //Saving games will be added in future updates.  Good bye';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}


//OLD
function createFavoriteColorAttributes(favoriteColor) {
    return {
        favoriteColor,
    };
}

//CALEB
function getStateFromSession(intent, session, callback,reprompt) {
    let favoriteColor;
    const repromptText = reprompt;
    let shouldEndSession = false;
    let speechOutput = '';
    var sessionAttributes = session.attributes;
    let state = 'Null';
    let count = 'Null';
    let difficulty = 'Null';
    let streeks = 'Null';
    let decks = 'Null';
    let left = 'Null';

    if (sessionAttributes) {
        state = sessionAttributes.state;
        count =  sessionAttributes.count;
        difficulty = sessionAttributes.difficulty;
        streeks = sessionAttributes.streeks;
        decks = sessionAttributes.decks;
        left = sessionAttributes.left[0];
    }

    if (state) {
        speechOutput = `The current state is <break time='200ms'/> ${state} <break time='200ms'/> Count is ${count} <break time='200ms'/>  Difficulty is ${difficulty} <break time='200ms'/>  Streak is ${streeks} <break time='200ms'/> Decks are ${decks} <break time='200ms'/> Aces left are ${left}  <break time='300ms'/> ${repromptText}`;
        shouldEndSession = false;
    } else {
        speechOutput = "I'm not sure what the state is.";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
         buildSpeechletResponse('Describe Session State', speechOutput, repromptText, shouldEndSession));
}

//CALEB
function startGame(intent, session, callback) {
    var sessionAttributes = session.attributes;
    let speechOutput = `Please specify the difficulty. A harder difficulty is faster and deals more cards. Say select difficulty easy, medium, or hard.`;
    let shouldEndSession = false;
    let repromptText = 'Please specify the difficulty. Say select difficulty easy, medium, or hard.';
    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    sessionAttributes.state = 'setup';
    callback(sessionAttributes,
         buildSpeechletResponse('Specify Difficulty', speechOutput, repromptText, shouldEndSession));
}

function setDifficultyBeginGame(intent, session, callback, difficultyInput) {
  session.attributes.state = 'playing';
  let difficulty  =  'medium';
  if(difficultyInput === ''){
    difficulty = intent.slots.difficulty.value;
  }else{
    difficulty = difficultyInput;
  }

  var sessionAttributes = session.attributes;
  let shouldEndSession = false;

  sessionAttributes.difficulty = difficulty;
  if(difficulty == 'easy'){
    sessionAttributes.streeks = 5;
    sessionAttributes.decks = 6;
  }else if(difficulty == 'medium'){
    sessionAttributes.streeks = 10;
    sessionAttributes.decks = 6;
  }else if(difficulty == 'hard'){
    sessionAttributes.streeks = 15;
    sessionAttributes.decks = 6;
  }else{ //IF IDK THEN IT'S MEDIUM
    sessionAttributes.streeks = 10;
    sessionAttributes.decks = 6;
  }
//################## initialize shuffle
  for (var i = 0, len = 13; i < len; i++) {
    sessionAttributes.left[i] = 4*parseInt(sessionAttributes.decks);
  }
  session.attributes.left = sessionAttributes.left;//because needs to access in pickCards
//Pick cards
  let cards = '';
  cards = pickCards(intent, session, callback);  //Pick off X cards from the left piles.  return piles minus taken cards and a list of the cards in order.

  //sessionAttributes = sessionAttributes;
  //let cards = "Ace, king, two";//cardsAndDeck.cards;


  let speechOutput = `You\'re playing on ${difficulty}. Note, The count does not reset each round. The count is Zero.  Here come your first round of cards <break time='1s'/> `+cards+`  What is the count? Say the count is X. `;
  let repromptText = ' What is the count? ';

  callback(sessionAttributes,
       buildSpeechletResponse("First Round", speechOutput, repromptText, shouldEndSession));

}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickCards(intent, session, callback){

  let sessionAttributes = session.attributes;

  let pause = '2';
  if(sessionAttributes.difficulty == 'easy'){
    pause = '3';
  }else if(sessionAttributes.difficulty == 'medium'){
    pause = '2';
  }else if(sessionAttributes.difficulty == 'hard'){
    pause = '1';
  }



  var available = [];
  for (var i = 0, len = 13; i < len; i++) {
    if(sessionAttributes.left[i] > 0){
      available.push(i);
    }
  }
  //good


  //## draw from available, if becomes unavailable remove from list.  This prevents infinitely picking unavailable numbers
  let draws = "";
  for (var k = 0, len2 = sessionAttributes.streeks; k < len2; k++) {

    let randomInt = getRandomInt(0,available.length-1);

    let newCard = sessionAttributes.cards[available[randomInt]] + " <break time='"+pause+"s'/> "; //parseInt(available[randomInt]
    draws = draws.concat(newCard);

    sessionAttributes.count += sessionAttributes.value[available[randomInt]];

    sessionAttributes.left[available[randomInt]] -= 1; //**** ERROR???



    if(sessionAttributes.left[available[randomInt]] === 0){//All of one type of card is gone. like kings or queens stack is now empty
      let index = available.indexOf(available[randomInt]);
      available.splice(index, 1);
    }

    if(available.length === 0){
      sessionAttributes.state = 'finished';
      //out of cards
      //*********** (((((((TO DO: SET STATE TO COMPLETE AND END THE GAME. SHOULD Pass the who sessionAttribute to and from pick cards so i can change the state )))))))
      break;
    }
  /*  */

  }

  session.attributes = sessionAttributes;
  //return draws;

  return draws;
}

//######################################################################################################################################

function checkCount(intent, session, callback) {
  let countGuess  =  intent.slots.count.value;
  let repromptText = 'What is the count? Example, the count is 10. ';
  let shouldEndSession = false;
  var sessionAttributes = session.attributes;
  let speechOutput = '';

  if (countGuess == sessionAttributes.count) {
      speechOutput = `Correct, the count is ${sessionAttributes.count}. `;
  }else{
      speechOutput = `Sorry, the count is ${sessionAttributes.count}. `;
  }

  if(sessionAttributes.state == 'finished'){
    speechOutput += 'There are no more cards in the card shoe.  Thank you for playing. To start a new game say start game otherwise say stop to quit.';
      //Perfect opprotunity to spout back any statistics from the game. (i should record some like max count, max correct streek)
    repromptText = 'There are no more cards in the card shoe.  Thank you for playing. To start a new game say start game otherwise say stop to quit.';
  }else{
    let cards = '';
    cards = pickCards(intent, session, callback);
    speechOutput += "Here we go <break time='1s'/> " + cards;
    speechOutput += " What is the count?";
  }


  callback(sessionAttributes,
       buildSpeechletResponse('Your Guess', speechOutput, repromptText, shouldEndSession));
}

function changeDifficulty(intent, session, callback, difficultyInput, reprompt){
  session.attributes.difficulty  =  intent.slots.difficulty.value;
  var sessionAttributes = session.attributes;

  let difficulty  =  'medium';
  if(difficultyInput === ''){
    difficulty = intent.slots.difficulty.value;
  }else{
    difficulty = difficultyInput;
  }

  if(difficulty == 'easy'){
    sessionAttributes.streeks = 5;
    sessionAttributes.decks = 6;
  }else if(difficulty == 'medium'){
    sessionAttributes.streeks = 10;
    sessionAttributes.decks = 6;
  }else if(difficulty == 'hard'){
    sessionAttributes.streeks = 15;
    sessionAttributes.decks = 6;
  }else{ //IF IDK THEN IT'S MEDIUM
    sessionAttributes.streeks = 10;
    sessionAttributes.decks = 6;
  }

  const repromptText = reprompt;
  let shouldEndSession = false;
  let speechOutput = `The difficulty is now set to ${session.attributes.difficulty}. ${repromptText}`;

  callback(sessionAttributes,
       buildSpeechletResponse('New Difficulty', speechOutput, repromptText, shouldEndSession));
}

//CALEB
function instructions(intent, session, callback) {
    const repromptText = 'What else would you like to know?';
    let shouldEndSession = false;
    let speechOutput = '';
    var sessionAttributes = session.attributes;
    let state = 'Null';

    if (sessionAttributes) {
        state = sessionAttributes.state;
    }

    if (state) {
        speechOutput = `The current state is ${state}.`;
        shouldEndSession = false;
    } else {
        speechOutput = "I'm not sure what the state is. ";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
         buildSpeechletResponse('Session State', speechOutput, repromptText, shouldEndSession));
}




//CALEB
// IF USER ASKS A SIMPLE PIECE OF INFORMATION THIS FUNCTION WILL DELIVER IT
function qAndAIntent(intent, session, callback,QandAResponse,QandAReprompt) {
    const repromptText = QandAReprompt;
    let shouldEndSession = false;
    let speechOutput = QandAResponse;
    var sessionAttributes = session.attributes;
    callback(sessionAttributes,
         buildSpeechletResponse('Q and A', speechOutput, repromptText, shouldEndSession));
}


/// ---------------------FOR MULTI PART INTENTS (NOT CURRENLTY USED)---------------------------

function delegateSlotCollection(request, sessionAttributes, callback){
  console.log("in delegateSlotCollection");
  console.log("  current dialogState: "+JSON.stringify(request.dialogState));

    if (request.dialogState === "STARTED") {
      console.log("in started");
      console.log("  current request: "+JSON.stringify(request));
      var updatedIntent=request.intent;
      //optionally pre-fill slots: update the intent object with slot values for which
      //you have defaults, then return Dialog.Delegate with this updated intent
      // in the updatedIntent property
      callback(sessionAttributes,
          buildSpeechletResponseWithDirectiveNoIntent());
    } else if (request.dialogState !== "COMPLETED") {
      console.log("in not completed");
      console.log("  current request: "+JSON.stringify(request));
      // return a Dialog.Delegate directive with no updatedIntent property.
      callback(sessionAttributes,
          buildSpeechletResponseWithDirectiveNoIntent());
    } else {
      console.log("in completed");
      console.log("  current request: "+JSON.stringify(request));
      console.log("  returning: "+ JSON.stringify(request.intent));
      // Dialog is now complete and all required slots should be filled,
      // so call your normal intent handler.
      return request.intent;
    }
}

function randomPhrase(array) {
    // the argument is an array [] of words or phrases
    var i = 0;
    i = Math.floor(Math.random() * array.length);
    return(array[i]);
}
function isSlotValid(request, slotName){
        var slot = request.intent.slots[slotName];
        //console.log("request = "+JSON.stringify(request)); //uncomment if you want to see the request
        var slotValue;

        //if we have a slot, get the text and store it into speechOutput
        if (slot && slot.value) {
            //we have a value in the slot
            slotValue = slot.value.toLowerCase();
            return slotValue;
        } else {
            //we didn't get a value in the slot.
            return false;
        }
}



// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    //Initializes session if you skip the welcome function
    let sessionAttributes = '';
    let testOuptut = 'None';
    if(!session.hasOwnProperty('attributes')){
      let testOuptut = 'some';
      sessionAttributes = initializeSessionAttributes();
      session.attributes = sessionAttributes;
    }

    //qAndAIntent('', session, callback,testOuptut+'session attributes:','');

    sessionAttributes = session.attributes;
    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;


    // Dispatch to your skill's intent handlers


        if (intentName === 'StartGameIntent') {
////## STARTING A NEW GAME
              if(session.attributes.state === 'lobby' || session.attributes.state === 'finished'){
                  startGame(intent, session, callback);
              }else{                                    //Message          //Reprompt <- should depend on current state to keep things moving
                  qAndAIntent(intent, session, callback,QandA.gameIsStarted,QandA.gameIsStarted);                                   //to start a new game please end your current session by saying echo stop.  ** can add another state that responds to yes and no.  starting a new game will end your current session.  please confirm that you would like to start a new game by saying yes or no.
              }
        } else if (intentName === 'InstructionsIntent' || intentName === 'AMAZON.HelpIntent') {
////## TELL ME THE INSTRUCTIONS
              if(session.attributes.state === 'lobby'){
                  qAndAIntent(intent, session, callback,QandA.instructionsLobby,QandA.instructionsLobbyReprompt);
              }else if(session.attributes.state === 'setup'){
                  qAndAIntent(intent, session, callback,QandA.instructionsSetup,QandA.instructionsSetupReprompt);
              }else if(session.attributes.state === 'playing' || session.attributes.state === 'finished'){
                  qAndAIntent(intent, session, callback,QandA.instructionsPlaying,QandA.instructionsPlayingReprompt);
              }else{

              }
        }else if(intentName === 'DifficultyIntent'){
////## USER SAYS DIFFICULTY
              if(session.attributes.state === 'lobby'){
                  qAndAIntent(intent, session, callback,QandA.startGameToSetDifficulty,QandA.startGameToSetDifficultyReprompt);
              }else if(session.attributes.state === 'setup'){
                  setDifficultyBeginGame(intent, session, callback,''); //and begin game.
              }else if(session.attributes.state === 'playing' || session.attributes.state === 'finished'){
                  changeDifficulty(intent, session, callback, '', QandA.instructionsPlayingReprompt); //what is the count
              }
        }else if(intentName === 'AnswerCountIntent'){
////## USER SAYS CURRENT COUNT, COMPUTER CHECKS
              if(session.attributes.state === 'playing' || session.attributes.state === 'finished'){
                  checkCount(intent, session, callback);
              }else if(session.attributes.state === 'lobby'){
                  qAndAIntent(intent, session, callback,QandA.startGameToGuessCountLobby,QandA.startGameToGuessCountRepromptLobby);
              }else if(session.attributes.state === 'setup' ){
                  qAndAIntent(intent, session, callback,QandA.startGameToGuessCountSetup,QandA.startGameToGuessCountRepromptSetup);
              }
        }else if(intentName === 'AnswerCountNegativeIntent'){ //amzn.Numbers does not support negative numbers
////## USER SAYS CURRENT COUNT, COMPUTER CHECKS
              if(session.attributes.state === 'playing' || session.attributes.state === 'finished'){
                  intent.slots.count.value *= -1;
                  checkCount(intent, session, callback);
              }else if(session.attributes.state === 'lobby'){
                  qAndAIntent(intent, session, callback,QandA.startGameToGuessCountLobby,QandA.startGameToGuessCountRepromptLobby);
              }else if(session.attributes.state === 'setup' ){
                  qAndAIntent(intent, session, callback,QandA.startGameToGuessCountSetup,QandA.startGameToGuessCountRepromptSetup);
              }
        }else if (intentName === 'sessionStateIntent') { //TESTING FUNCTION
              if(session.attributes.state === 'lobby' ){
                  getStateFromSession(intent, session, callback,QandA.startGameToGuessCountRepromptLobby); //say start game
              }else if(session.attributes.state === 'setup'){
                  getStateFromSession(intent, session, callback,QandA.startGameToGuessCountRepromptSetup); //select difficulty
              }else if(session.attributes.state === 'playing' || session.attributes.state === 'finished'){
                  getStateFromSession(intent, session, callback,QandA.instructionsPlayingReprompt); //what is the count
              }
        }else if (intentName === 'valuesIntent') {
              if(session.attributes.state === 'lobby' ){
                  qAndAIntent(intent, session, callback,QandA.repeatValuesIntent,QandA.startGameToGuessCountRepromptLobby);
              }else if(session.attributes.state === 'setup'){
                  qAndAIntent(intent, session, callback,QandA.repeatValuesIntentDifficulty,QandA.instructionsSetupReprompt);
              }else if(session.attributes.state === 'playing' || session.attributes.state === 'finished'){
                  qAndAIntent(intent, session, callback,QandA.repeatValuesIntentPlaying,QandA.instructionsPlayingReprompt);
              }
        }else if (intentName === 'easyIntent') { //INCASE PEOPLE DONT "SAY SET DIFFICULTY" - fail safe bc so few options
              if(session.attributes.state === 'lobby' ){
                  qAndAIntent(intent, session, callback,QandA.startGameToSetDifficulty,QandA.startGameToSetDifficultyReprompt);
              }else if(session.attributes.state === 'setup'){
                  setDifficultyBeginGame(intent, session, callback,'easy'); //and begin game.
              }else if(session.attributes.state === 'playing' || session.attributes.state === 'finished'){
                  changeDifficulty(intent, session, callback,'easy', QandA.instructionsPlayingReprompt); //what is the count
              }
        }else if (intentName === 'mediumIntent') {
              if(session.attributes.state === 'lobby' ){
                  qAndAIntent(intent, session, callback,QandA.startGameToSetDifficulty,QandA.startGameToSetDifficultyReprompt);
              }else if(session.attributes.state === 'setup'){
                  setDifficultyBeginGame(intent, session, callback,'medium'); //and begin game.
              }else if(session.attributes.state === 'playing' || session.attributes.state === 'finished'){
                  changeDifficulty(intent, session, callback,'medium', QandA.instructionsPlayingReprompt); //what is the count
              }
        }else if (intentName === 'hardIntent') {
              if(session.attributes.state === 'lobby' ){
                  qAndAIntent(intent, session, callback,QandA.startGameToSetDifficulty,QandA.startGameToSetDifficultyReprompt);
              }else if(session.attributes.state === 'setup'){
                  setDifficultyBeginGame(intent, session, callback,'hard'); //and begin game.
              }else if(session.attributes.state === 'playing' || session.attributes.state === 'finished'){
                  changeDifficulty(intent, session, callback, 'hard', QandA.instructionsPlayingReprompt); //what is the count
              }
        }else if (intentName === 'countIsXIntent') {
              if(session.attributes.state === 'lobby' ){
                  qAndAIntent(intent, session, callback,QandA.theCountIsXLobby,QandA.startGameToSetDifficultyReprompt);
              }else if(session.attributes.state === 'setup'){
                  qAndAIntent(intent, session, callback,QandA.theCountIsXSetup,QandA.instructionsSetupReprompt);
              }else if(session.attributes.state === 'playing' || session.attributes.state === 'finished'){
                  qAndAIntent(intent, session, callback,QandA.theCountIsXPlaying,QandA.instructionsPlayingReprompt);
              }
        }else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
              handleSessionEndRequest(callback);
        } else {
            //INVALID INPUT???
            if(session.attributes.state === 'lobby' ){
                qAndAIntent(intent, session, callback,QandA.notAValidInputLobby,QandA.startGameToSetDifficultyReprompt);
            }else if(session.attributes.state === 'setup'){
                qAndAIntent(intent, session, callback,QandA.notAValidInputSetup,QandA.instructionsSetupReprompt);
            }else if(session.attributes.state === 'playing' || session.attributes.state === 'finished'){
                qAndAIntent(intent, session, callback,QandA.notAValidInputPlaying,QandA.instructionsPlayingReprompt);
            }else{
                throw new Error('Invalid intent');
            }
        }

}

var QandA = {
  gameIsStarted:'You are currently playing a game. To start a new game please end your session by saying echo stop.',
  instructionsLobby:'Counting cards is a simple math based game used to beat casinos at black jack.  When there are a high number of face cards in the deck the probability that the '+
  'dealer will bust goes up.  Therefore to count cards we start with a value of zero.  For cards two through six we add one to the count<break time="500ms"/> For cards 10 through ace we subtract '+
  ' one from the count <break time="500ms"/> And for cards seven through nine we do nothing <break time="500ms"/> Alexa will say a number of cards out loud.  It is your job to add or subtract from the count.  when she stops she will ask you for the count. To start a new game say start game.  To repeat the values say values.',
  repeatValuesIntent:' Two through six, plus one <break time="500ms"/> Seven through nine, plus zero <break time="500ms"/> Ten through ace, minus one <break time="500ms"/> Say repeat values or new game. ',
  repeatValuesIntentDifficulty:' Two through six, plus one <break time="500ms"/> Seven through nine, plus zero <break time="500ms"/> Ten through ace, minus one <break time="500ms"/> Please say select difficulty easy, medium, or hard. ',
  repeatValuesIntentPlaying:' Two through six, plus one <break time="500ms"/> Seven through nine, plus zero <break time="500ms"/> Ten through ace, minus one <break time="500ms"/> What is the count? Say the count is 10. ',
  instructionsLobbyReprompt:'To start a new game say start game.',
  instructionsSetup:'Please pick a difficulty level.  A harder difficulty is faster, and deals more cards.  Please say select difficulty easy, medium, or hard. ',
  instructionsSetupReprompt:'Please say select difficulty easy, medium, or hard.',
  instructionsPlaying:'Listen to the cards.  From the last given count add 1 for numbers 2 through 6 and subtract one for numbers 10 through ace. If the difficulty is to hard or too easy simply say. Select difficulty easy, medium, or hard. Make difficulty changes when prompted for the count. Otherwise tell me, what is the count?',
  instructionsPlayingReprompt:'What is the count? say the count is X.',
  startGameToSetDifficulty:'You cannot set the difficulty because you are not playing a game.  Say start game to begin a new game.',
  startGameToSetDifficultyReprompt:'Say start game to begin a new game or read instructions to hear the instructions.',
  startGameToGuessCountLobby:'You cannot yet guess the count because you are not playing a game.  Say start game to begin a new game.',
  startGameToGuessCountSetup:'You cannot yet guess the count because you are not playing a game.  To begin Say select difficulty easy, medium or hard.',
  startGameToGuessCountRepromptLobby:'Say start game to begin a new game or say instructions to hear the instructions.',
  startGameToGuessCountRepromptSetup:'Say select difficulty easy, medium or hard to begin.',
  theCountIsXLobby:' Ahem, a quick public service announcement. You\'re not yet playing but we\'ll use this as a learning opportunity. Saying the count is X is a filler. Like saying sign on the line next to the X. To actually give the count say the count is 10, the count is negative 2, or the count is 4, you get it  <break time="300ms"/> Now, say start game, instructions, or values. ',
  theCountIsXSetup:' Ahem, a quick public service announcement. You\'re not yet playing but we\'ll use this as a learning opportunity. Saying the count is X is a filler. Like saying sign on the line next to the X. To actually give the count say the count is 10, the count is negative 2, or the count is 4, you get it  <break time="300ms"/> Now, Say select difficulty easy, medium or hard to begin. ',
  theCountIsXPlaying:' Ahem, a quick public service announcement. saying the count is X is a filler. like saying sign on the line next to the X. To actually give the count say the count is 10, the count is negative 2, or the count is 4, you get it  <break time="300ms"/> now, what is the count? say the count is X. ',
  notAValidInputLobby:' That is not a valid input, you are playing the game counting cards or did you forget? Say start game, instructions, or values. ',
  notAValidInputSetup:' That is not a valid input, you are playing the game counting cards or did you forget? Please say select difficulty easy, medium, or hard.',
  notAValidInputPlaying:' That is not a valid input, you are playing the game counting cards or did you forget? Now, what is the count? say the count is X. ',
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

        if (event.session.application.applicationId != process.env.appID) {
             callback('Invalid Application ID');
        }


        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
