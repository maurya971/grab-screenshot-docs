import express from 'express';
import { RegisterRoutes } from './routes/routes';
import * as swaggerUi from 'swagger-ui-express';
const swaggerDoc = require('./swagger.json');

const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Hello World! from main'));
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDoc));
RegisterRoutes(app);

app.listen(port, () => console.log(`Server started listening to port ${port}`));