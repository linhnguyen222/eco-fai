const express = require('express');
const path = require('path');
const setupProxy = require('./src/setupProxy');
const app = express();

setupProxy(app);
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(process.env.PORT || 3000);
