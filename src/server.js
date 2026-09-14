'use strict';

const createApp = require('./app');

const PORT = process.env.PORT || 8080;
const VERSION = process.env.APP_VERSION || '1.0';
const app = createApp();

app.listen(PORT, () => {
  console.log(`TodoList v${VERSION} escuchando en el puerto ${PORT}`);
});
