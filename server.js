var express = require('express');
var port = process.env.PORT || 1337;
var app = express();

app.configure(function () {
	app.use(express.static(__dirname));
})

app.get('/', function(req, res){
	res.redirect("/backbonefun.html");
});
	
app.listen(port);

