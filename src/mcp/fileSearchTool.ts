import { logger } from '../utils/logger.js';
import { openaiClient } from '../config/openai.js';
import { resolveVectorStoreId } from './vectorStoreMapping.js';

export interface FileSearchQuery {
  vectorStoreId: string;
  query: string;
}

const SEARCH_TIMEOUT_MS = 60000; // 60 segundos
const POLL_INTERVAL_MS = 1000; // 1 segundo

/**
 * Aguarda até que um run seja concluído
 */
async function waitForRunCompletion(
  threadId: string,
  runId: string,
  timeoutMs: number = SEARCH_TIMEOUT_MS
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const run = await openaiClient.beta.threads.runs.retrieve(threadId, runId);
    
    if (run.status === 'completed') {
      return;
    }
    
    if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
      const errorMessage = run.last_error?.message || 'Run falhou';
      throw new Error(`Run ${run.status}: ${errorMessage}`);
    }
    
    // Aguardar antes de verificar novamente
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  
  throw new Error(`Timeout aguardando conclusão do run (${timeoutMs}ms)`);
}

/**
 * Extrai a resposta da última mensagem do assistant
 */
async function extractResponse(threadId: string): Promise<string[]> {
  const messages = await openaiClient.beta.threads.messages.list(threadId, {
    limit: 1,
    order: 'desc',
  });
  
  if (messages.data.length === 0) {
    return [];
  }
  
  const lastMessage = messages.data[0];
  const content = lastMessage.content;
  
  if (!content || content.length === 0) {
    return [];
  }
  
  // Extrair texto de todos os blocos de conteúdo
  const texts: string[] = [];
  for (const block of content) {
    if (block.type === 'text' && 'text' in block && block.text) {
      texts.push(block.text.value);
    }
  }
  
  return texts;
}

/**
 * Busca em vector stores do OpenAI usando Assistants API
 */
export async function fileSearch(query: FileSearchQuery): Promise<string[]> {
  logger.info(
    { vectorStoreId: query.vectorStoreId, query: query.query },
    'Iniciando busca em vector store'
  );
  
  let assistantId: string | undefined;
  let threadId: string | undefined;
  
  try {
    // 1. Resolver vectorStoreId lógico → real
    const realVectorStoreId = await resolveVectorStoreId(query.vectorStoreId);
    
    if (!realVectorStoreId) {
      logger.warn(
        { collectionId: query.vectorStoreId },
        'Vector store não encontrado'
      );
      return [];
    }
    
    logger.debug(
      { collectionId: query.vectorStoreId, realId: realVectorStoreId },
      'Vector store resolvido'
    );
    
    // 2. Criar assistant temporário com vector store anexado
    const assistant = await openaiClient.beta.assistants.create({
      model: 'gpt-4o-mini', // Modelo mais barato para busca
      instructions: 'You are a helpful assistant that searches documents and provides relevant information. Answer based only on the files provided.',
      tools: [{ type: 'file_search' }],
      tool_resources: {
        file_search: {
          vector_store_ids: [realVectorStoreId],
        },
      },
    });
    
    assistantId = assistant.id;
    logger.debug({ assistantId }, 'Assistant temporário criado');
    
    // 3. Criar thread
    const thread = await openaiClient.beta.threads.create();
    threadId = thread.id;
    logger.debug({ threadId }, 'Thread criada');
    
    // 4. Adicionar mensagem com query
    await openaiClient.beta.threads.messages.create(threadId, {
      role: 'user',
      content: query.query,
    });
    
    // 5. Executar run e aguardar conclusão
    const run = await openaiClient.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });
    
    logger.debug({ runId: run.id }, 'Run iniciado');
    
    await waitForRunCompletion(threadId, run.id);
    
    // 6. Extrair resposta da última mensagem
    const results = await extractResponse(threadId);
    
    logger.info(
      { vectorStoreId: query.vectorStoreId, resultsCount: results.length },
      'Busca concluída'
    );
    
    return results;
    
  } catch (error) {
    logger.error(
      { error, vectorStoreId: query.vectorStoreId, query: query.query },
      'Erro ao buscar em vector store'
    );
    
    // Retornar array vazio em caso de erro (a tool já trata isso)
    return [];
    
  } finally {
    // 7. Limpar recursos temporários
    try {
      if (assistantId) {
        await openaiClient.beta.assistants.del(assistantId);
        logger.debug({ assistantId }, 'Assistant temporário deletado');
      }
    } catch (error) {
      logger.warn({ error, assistantId }, 'Erro ao deletar assistant');
    }
    
    try {
      if (threadId) {
        await openaiClient.beta.threads.del(threadId);
        logger.debug({ threadId }, 'Thread deletada');
      }
    } catch (error) {
      logger.warn({ error, threadId }, 'Erro ao deletar thread');
    }
  }
}
