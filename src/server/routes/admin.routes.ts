import { Express, Request, Response } from "express";
import { runDailyPortalsScan } from "../../workflows/daily-portals-scan.js";
import { classifyDocument } from "../../agents/maintenance.js";
import { PortalDocument } from "../../agents/types.js";
import { logger } from "../../utils/logger.js";

export function registerAdminRoutes(app: Express) {
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check do servidor
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Servidor está funcionando
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  app.get("/health", (_req: Request, res: Response) => {
    logger.debug("Health check requested");
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  /**
   * @swagger
   * /admin/run-daily:
   *   post:
   *     summary: Executa varredura diária de portais fiscais
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Varredura iniciada/completada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: completed
   *                 timestamp:
   *                   type: string
   *                   format: date-time
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
  app.post("/admin/run-daily", async (_req: Request, res: Response) => {
    try {
      logger.info("Starting daily portals scan");
      await runDailyPortalsScan();
      logger.info("Daily portals scan completed");
      res.json({ status: "completed", timestamp: new Date().toISOString() });
    } catch (err) {
      logger.error({ error: err }, "/admin/run-daily failed");
      res.status(500).json({ error: "internal_error" });
    }
  });

  /**
   * @swagger
   * /admin/classify-document:
   *   post:
   *     summary: Classifica um documento fiscal usando o tax-document-classifier
   *     tags: [Admin]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - portalId
   *               - title
   *               - url
   *             properties:
   *               portalId:
   *                 type: string
   *                 description: ID do portal fiscal
   *                 example: "encat-nfce"
   *               portalType:
   *                 type: string
   *                 description: Tipo do portal (nacional ou estadual)
   *                 example: "estadual"
   *               title:
   *                 type: string
   *                 description: Título do documento
   *                 example: "Nota Técnica NT 2024.001 - NFC-e"
   *               url:
   *                 type: string
   *                 description: URL do documento
   *                 example: "https://www.nfce.fazenda.sp.gov.br/nt/2024.001"
   *               publishedAt:
   *                 type: string
   *                 format: date-time
   *                 description: Data de publicação (opcional)
   *               externalId:
   *                 type: string
   *                 description: ID externo do documento (opcional)
   *     responses:
   *       200:
   *         description: Classificação do documento
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 vectorStoreId:
   *                   type: string
   *                   description: ID do vector store de destino
   *                 tags:
   *                   type: array
   *                   items:
   *                     type: string
   *                   description: Tags associadas ao documento
   *                 rationale:
   *                   type: string
   *                   description: Explicação da classificação
   *                 score:
   *                   type: number
   *                   description: Score de confiança
   *       400:
   *         description: Erro de validação
   *       500:
   *         description: Erro interno
   */
  app.post("/admin/classify-document", async (req: Request, res: Response) => {
    try {
      const document: PortalDocument = {
        portalId: req.body.portalId,
        portalType: req.body.portalType,
        title: req.body.title,
        url: req.body.url,
        publishedAt: req.body.publishedAt,
        detectedAt: req.body.detectedAt || new Date().toISOString(),
        externalId: req.body.externalId,
        contentHash: req.body.contentHash,
        sourceListing: req.body.sourceListing,
        // Campos opcionais do crawler
        domain: req.body.domain,
        natureza: req.body.natureza,
        assuntos: req.body.assuntos,
        fileName: req.body.fileName,
        modelo: req.body.modelo,
        // Amostra de texto normalizado
        normalizedTextSample: req.body.normalizedTextSample,
      };

      if (!document.portalId || !document.title || !document.url) {
        return res.status(400).json({
          error: "validation_error",
          message: "portalId, title e url são obrigatórios",
        });
      }

      logger.info(
        {
          portalId: document.portalId,
          title: document.title,
          hasTextSample: !!document.normalizedTextSample,
          textSampleLength: document.normalizedTextSample?.length || 0,
        },
        "[LOG TEMPORÁRIO] Classifying document"
      );
      
      if (document.normalizedTextSample) {
        logger.info(
          {
            preview: document.normalizedTextSample.substring(0, 150),
          },
          "[LOG TEMPORÁRIO] Prévia da amostra de texto recebida"
        );
      }

      const classification = await classifyDocument(document);

      logger.info(
        {
          portalId: document.portalId,
          vectorStoreId: classification.vectorStoreId,
          score: classification.score,
        },
        "Document classified"
      );

      res.json(classification);
    } catch (err) {
      logger.error({ error: err }, "/admin/classify-document failed");
      res.status(500).json({ error: "internal_error" });
    }
  });
}
