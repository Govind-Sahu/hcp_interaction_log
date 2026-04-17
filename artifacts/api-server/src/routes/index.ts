import { Router, type IRouter } from "express";
import healthRouter from "./health";
import hcpsRouter from "./hcps";
import interactionsRouter from "./interactions";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/hcps", hcpsRouter);
router.use("/interactions", interactionsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/ai", aiRouter);

export default router;
