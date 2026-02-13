import { Express, Request, Response } from "express";
import { runUserQueryWorkflow, runUserQueryWorkflowStream } from "../../workflows/user-query.js";
import type { WorkflowStreamEvent } from "../../workflows/user-query.js";
import { validate } from "../../middleware/validation.js";
import { userQueryRequestSchema } from "../schemas/query.schemas.js";
import { logger } from "../../utils/logger.js";

function writeSSE(res: Response, event: string, data: unknown): void {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  res.write(`event: ${event}\ndata: ${payload}\n\n`);
}

export function registerQueryRoutes(app: Express) {
  /**
   * @swagger
   * /query:
   *   post:
   *     summary: Processa uma consulta tributária
   *     tags: [Query]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - question
   *             properties:
   *               question:
   *                 type: string
   *                 description: Pergunta do usuário sobre questões tributárias
   *                 example: "Qual a alíquota de ICMS para produtos eletrônicos?"
   *               context:
   *                 type: string
   *                 description: Contexto adicional opcional
   *                 example: "Cliente está em São Paulo"
   *               metadata:
   *                 type: object
   *                 description: Metadados adicionais opcionais
   *     responses:
   *       200:
   *         description: Resposta da consulta
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 answer:
   *                   type: string
   *                   description: Resposta gerada pelos agentes
   *                 sources:
   *                   type: array
   *                   items:
   *                     type: string
   *                   description: Fontes consultadas
   *                 plan:
   *                   type: array
   *                   items:
   *                     type: string
   *                   description: Plano de execução
   *                 agentTraces:
   *                   type: array
   *                   description: Traces dos agentes executados
   *       400:
   *         description: Erro de validação
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: validation_error
   *                 message:
   *                   type: string
   *                 details:
   *                   type: array
   *       500:
   *         description: Erro interno
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: internal_error
   */
  app.post(
    "/query",
    validate({ body: userQueryRequestSchema }),
    async (req: Request, res: Response) => {
      try {
        logger.info({ question: req.body.question }, "Processing user query");
        const result = await runUserQueryWorkflow(req.body);
        logger.info({ answerLength: result.answer.length }, "Query processed successfully");
        res.json(result);
      } catch (err) {
        logger.error({ error: err }, "/query failed");
        res.status(500).json({ error: "internal_error" });
      }
    }
  );

  /**
   * POST /query/stream — mesma entrada que /query, resposta em Server-Sent Events (step, thought, tool, agent, done).
   */
  app.post(
    "/query/stream",
    validate({ body: userQueryRequestSchema }),
    async (req: Request, res: Response) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const onEvent = (event: WorkflowStreamEvent) => {
        if (event.type === "step") {
          writeSSE(res, "step", { step: event.step, label: event.label });
        } else if (event.type === "thought") {
          writeSSE(res, "thought", { delta: event.delta, text: event.delta });
        } else if (event.type === "tool") {
          writeSSE(res, "tool", { name: event.name, args: event.args });
        } else if (event.type === "agent") {
          writeSSE(res, "agent", { name: event.name });
        } else if (event.type === "done") {
          writeSSE(res, "done", {
            answer: event.answer,
            plan: event.plan,
            sources: event.sources,
            agentTraces: event.agentTraces,
          });
        }
      };

      try {
        logger.info({ question: req.body.question }, "Processing user query (stream)");
        await runUserQueryWorkflowStream(req.body, onEvent);
        res.end();
      } catch (err) {
        logger.error({ error: err }, "/query/stream failed");
        writeSSE(res, "error", { message: err instanceof Error ? err.message : "internal_error" });
        res.end();
      }
    }
  );
}
