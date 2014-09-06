// Start sails and pass it command line arguments
//require('sails').lift(require('optimist').argv);

require('sails').lift(
  {
  },
  function(err, sails) {
     // pass it command line arguments
     require('optimist').argv;
     // option override config here
     sails.config.appName = "Wechat test app";
   }
);