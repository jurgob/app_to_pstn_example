/**
nexmo context: 
you can find this as the second parameter of rtcEvent funciton or as part or the request in req.nexmo in every request received by the handler 
you specify in the route function.

it contains the following: 
const {
        generateBEToken,
        generateUserToken,
        logger,
        csClient,
        storageClient
} = nexmo;

- generateBEToken, generateUserToken,// those methods can generate a valid token for application
- csClient: this is just a wrapper on https://github.com/axios/axios who is already authenticated as a nexmo application and 
    is gonna already log any request/response you do on conversation api. 
    Here is the api spec: https://jurgob.github.io/conversation-service-docs/#/openapiuiv3
- logger: this is an integrated logger, basically a bunyan instance
- storageClient: this is a simple key/value inmemory-storage client based on redis

*/

/**
 *
 * This function is meant to handle all the asyncronus event you are gonna receive from conversation api
 *
 * it has 2 parameters, event and nexmo context
 * @param {object} event - this is a conversation api event. Find the list of the event here: https://jurgob.github.io/conversation-service-docs/#/customv3
 * @param {object} nexmo - see the context section above
 * */

const path = require("path");

const CS_URL = `https://api.nexmo.com`;
const WS_URL = `https://ws.nexmo.com`;

const rtcEvent = async (event, { logger, csClient }) => {
  try {
  } catch (err) {
    logger.error({ err }, "Error on rtcEvent function");
  }
};

const messageEvent = async (event, { logger, csClient }) => {
  try {
  } catch (err) {
    logger.error({ err }, "Error on messageEvent function");
  }
};

const voiceEvent = async (req, res, next) => {
  const { logger } = req.nexmo;
  try {
      logger.info("event", { event: req.body});
      res.json({});
  } catch (err) {
      logger.error("Error on voiceEvent function")
  }
}

//App entry point
const voiceAnswer = async (req, res, next) => {
  const { logger } = req.nexmo;
  logger.info("req", { req_body: req.body});
  try {
      return res.json({});
  } catch (err) {
      logger.error("Error on voiceAnswer function");
  }
}



/**
 *
 * @param {object} app - this is an express app
 * you can register and handler same way you would do in express.
 * the only difference is that in every req, you will have a req.nexmo variable containning a nexmo context
 *
 */
const route = (app, express) => {
  // app.use(express.static(path.join(__dirname, "build")));
  // app.get("/", function (req, res) {
  //   res.sendFile(path.join(__dirname, "build", "index.html"));
  // });
  app.use(express.json());

  app.post("/api/login", async (req, res) => {
    const {
      generateBEToken,
      generateUserToken,
      logger,
      csClient,
      storageClient,
    } = req.nexmo;

    const { username } = req.body;
    logger.info({body: req.body},"login body")
    if(!username){
      res.status(400)
      return res.json({
        err: "username can't be empty"
      })
    }
    res.json({
      user: username,
      token: generateUserToken(username),
      ws_url: WS_URL,
      cs_url: CS_URL,
    });
  });

  app.post("/api/subscribe", async (req, res) => {
    const {
      generateBEToken,
      generateUserToken,
      logger,
      csClient,
      storageClient,
    } = req.nexmo;

    try {
      const { username } = req.body;
      if(!username){
        res.status(400)
        return res.json({
          err: "username can't be empty"
        })
      }
      const resNewUser = await csClient({
        url: `${CS_URL}/v0.3/users`,
        method: "post",
        data: {
          name: username,
        },
      });

      await storageClient.set(`user:${username}`, resNewUser.data.id);
      const storageUser = await storageClient.get(`user:${username}`);

      return res.json({ username, resNewUser: resNewUser.data, storageUser });
    } catch (err) {
      console.log("error", err);
      logger.error({ err }, "ERROR");
      throw err;
    }
  });

  app.get("/api/users", async (req, res) => {
    const { logger, csClient, storageClient } = req.nexmo;


      const userListResponse = await csClient({
        url: `${CS_URL}/v0.3/users`,
        method: "get",
      });

      const users = userListResponse.data._embedded.users;

    res.json({ users });
  });

  app.get("/api/users/:username", async (req, res) => {
    const { logger, csClient, storageClient } = req.nexmo;

    const { username } = req.params;
    let user;
    user = await storageClient.get(`user:${username}`);
    if(user){
      console.log(`user `, user)
      user = JSON.parse(user)
    }
    if (!user) {
      let userResponse;
      try{
        userResponse = await csClient({
          url: `${CS_URL}/v0.3/users?name=${username}`,
          method: "get",
        });
      }catch(e){
        res.status(404)
        res.json({ err: "user not found" });
      }
      user = userResponse.data._embedded.users[0];
      await storageClient.set(`user:${username}`, JSON.stringify(user));
    }
    res.json({ user });
  });

  app.post("/api/invite/:conversation_name/:username", async (req, res) => {
    const { logger, csClient, storageClient } = req.nexmo;

    const { username ,conversation_name} = req.params;

    try{
      let user;
      user = await storageClient.get(`user:${username}`);
      if(user){
        console.log(`user `, user)
        user = JSON.parse(user)
      }
      if (!user) {
        const userResponse = await csClient({
          url: `${CS_URL}/v0.3/users?name=${username}`,
          method: "get",
        });
        user = userResponse.data._embedded.users[0];
        await storageClient.set(`user:${username}`, JSON.stringify(user));
      }

      let conversation;
      const conversationResponse = await csClient({
        url: `${CS_URL}/v0.3/conversations`,
        method: "post",
        data:{
          name: conversation_name
        }
      });
      conversation = conversationResponse.data;

      let member;
      const memberResponse = await csClient({
        url: `${CS_URL}/v0.3/conversations/${conversation.id}/members`,
        method: "post",
        data:{
          "state": "invited",
          "user": {
            "name": username
          },
          "channel": {
            "type": "app"
          }
        }
      });
      conversation = conversationResponse.data;


      res.json({ user, conversation,member });
    }catch(e){
      res.status(500).json({ error: e });
    }
  });

};

module.exports = {
  rtcEvent,
  messageEvent,
  voiceAnswer,
  voiceEvent,
  route,
};
