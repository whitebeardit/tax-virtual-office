import { Express, Request, Response } from "express";
import { runUserQueryWorkflow } from "../../workflows/user-query.js";
import { validate } from "../../middleware/validation.js";
import { userQueryRequestSchema } from "../schemas/query.schemas.js";
import { logger } from "../../utils/logger.js";

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
}
