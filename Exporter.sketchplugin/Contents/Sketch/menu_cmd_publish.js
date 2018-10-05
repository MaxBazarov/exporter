@import("classes/publisher.js")

var onRun = function(context) {  

  const publisher = new Publisher(context,context.document);
  publisher.publish();

};