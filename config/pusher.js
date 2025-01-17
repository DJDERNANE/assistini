const Pusher = require("pusher");


const pusher = new Pusher({
  appId : 1927036,
  key : "88f152f07bbe6b8224c0",
  secret : "728660065f975e53b724",
  cluster : "eu",
  });


  exports.pusher = pusher