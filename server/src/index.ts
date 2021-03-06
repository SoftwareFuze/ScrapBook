import { LogType, log } from './util/log.util';
import express, { Application, json } from 'express';
import { UserRouter, AuthRouter, CommunitiesRouter, PostRouter, FoldersRouter } from './routes';
import cors from "cors";

const app: Application = express();

(async () => {
  async function main(port: number) {
    app.use(json({ limit: '2.5mb' }));
    app.use(cors({ origin: "http://localhost:3000" }));
    app.use('/users', UserRouter);
    app.use('/auth', AuthRouter);
    app.use('/communities', CommunitiesRouter);
    app.use('/posts', PostRouter);
    app.use('/folders', FoldersRouter);
    app.listen(port, () => log(LogType.INIT, `Server started on port ${port}`));
  }

  try {
    await main(8080);
  } catch(err: any) {
    log(LogType.ERROR, err);
  }
})();

process.on('exit', () => {
  log(LogType.TERMINATE, 'Server terminated');
  return;
});