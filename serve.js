const express = require('express');
const app = express();
app.use(express.static('./dist/train-diagram'));

app.get('/*', function(req, res) {
  res.sendFile('index.html', {root: '.'}
  );
});

app.listen(process.env.PORT || 4200);