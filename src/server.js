'use strict';

const createApp = require('./app');

const PORT = process.env.PORT || 8080;
const app = createApp();

app.listen(PORT, () => {
  console.log(`todo-api escuchando en el puerto ${PORT}`);
});
