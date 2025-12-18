# Sistema de Sincronização - MathDash

Este documento descreve o sistema de sincronização do MathDash, permitindo que aplicativos móveis enviem dados de questões, tentativas e feedback para o dashboard.

---

## Parte 1: Documentação Técnica

### 1.1 Arquitetura

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   App Móvel     │   POST  │   /api/sync     │  Prisma │   PostgreSQL    │
│   (Cliente)     │ ──────> │   (Next.js)     │ ──────> │   (Supabase)    │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

**Fluxo de dados:**
1. O app móvel coleta dados localmente (questões respondidas, feedback, etc.)
2. Periodicamente, envia um batch via POST para `/api/sync`
3. O endpoint processa cada item usando **upsert** (cria ou atualiza)
4. Retorna um resumo do que foi sincronizado

### 1.2 Endpoint

| Método | URL | Descrição |
|--------|-----|-----------|
| POST | `/api/sync` | Sincroniza dados em batch |

### 1.3 Autenticação

A API suporta dois métodos de autenticação:

**Opção 1: Header HTTP**
```
x-api-key: sua-chave-secreta
```

**Opção 2: No corpo do payload**
```json
{
  "apiKey": "sua-chave-secreta",
  ...
}
```

> **Importante:** A variável de ambiente `SYNC_API_KEY` define a chave esperada.
> - **Se configurada:** A autenticação é **obrigatória**. Requisições sem a chave correta retornam `401 Unauthorized`.
> - **Se não configurada:** A autenticação é desabilitada (não recomendado para produção).

### 1.4 Estrutura do Payload

```typescript
interface SyncPayload {
  apiKey?: string;
  questions?: Question[];
  solutionSteps?: SolutionStep[];
  attempts?: Attempt[];
  feedbacks?: Feedback[];
}
```

### 1.5 Schemas de Validação (Zod)

#### Question
```typescript
{
  externalId: string;        // Obrigatório - ID único do app
  title: string;             // Obrigatório - mínimo 3 caracteres
  content: string;           // Obrigatório - mínimo 3 caracteres
  topic?: string;            // Opcional - ex: "Álgebra", "Geometria"
  difficulty?: "EASY" | "MEDIUM" | "HARD";  // Opcional
}
```

#### SolutionStep
```typescript
{
  externalId: string;        // Obrigatório - ID único do app
  questionId?: string;       // ID interno da questão (se conhecido)
  questionExternalId?: string; // OU externalId da questão
  order: number;             // Obrigatório - ordem do passo (1, 2, 3...)
  content: string;           // Obrigatório - conteúdo do passo
}
```

#### Attempt
```typescript
{
  externalId: string;        // Obrigatório - ID único do app
  questionId?: string;       // ID interno da questão
  questionExternalId?: string; // OU externalId da questão
  userId?: string;           // ID do usuário do dashboard
  appUserId?: string;        // ID do usuário no app móvel
  studentName?: string;      // Nome do estudante
  correct: boolean;          // Obrigatório - acertou ou errou
  timeMs: number;            // Obrigatório - tempo em milissegundos
  attempts?: number;         // Número de tentativas (default: 1)
  source?: string;           // Origem (default: "app")
  topic?: string;            // Tópico da questão
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  createdAt?: string;        // ISO 8601 datetime
  updatedAt?: string;        // ISO 8601 datetime (opcional)
}
```

#### Feedback
```typescript
{
  externalId: string;        // Obrigatório - ID único do app
  questionId?: string;       // ID interno da questão (opcional)
  questionExternalId?: string; // OU externalId da questão (opcional)
  userId?: string;           // ID do usuário do dashboard
  appUserId?: string;        // ID do usuário no app móvel
  studentName?: string;      // Nome do estudante
  rating: number;            // Obrigatório - 1 a 5
  comment?: string;          // Comentário opcional
  createdAt?: string;        // ISO 8601 datetime
  updatedAt?: string;        // ISO 8601 datetime (opcional)
}
```

### 1.6 Lógica de Upsert

O sistema usa **externalId** como chave única para cada entidade:

```typescript
// Se existe registro com esse externalId → UPDATE
// Se não existe → CREATE
await prisma.question.upsert({
  where: { externalId: question.externalId },
  update: data,
  create: { ...data, externalId: question.externalId }
})
```

**Benefícios:**
- Idempotência: enviar os mesmos dados várias vezes não cria duplicatas
- Sincronização incremental: pode enviar apenas dados alterados
- Resiliência: se a conexão falhar, pode reenviar sem problemas

### 1.7 Vinculação de Entidades

Para `solutionSteps`, `attempts` e `feedbacks`, a vinculação com questões pode ser feita de duas formas:

1. **Por questionId** (ID interno do banco)
2. **Por questionExternalId** (ID externo do app)

O sistema resolve automaticamente:
```typescript
let questionId = attempt.questionId
if (!questionId && attempt.questionExternalId) {
  questionId = await ensureQuestionId(attempt.questionExternalId, cache)
}
```

### 1.8 Resposta da API

**Sucesso (200):**
```json
{
  "ok": true,
  "questions": 5,
  "solutionSteps": 10,
  "attempts": 25,
  "feedbacks": 3
}
```

**Erro de autenticação (401):**
```
Unauthorized
```

**Erro de validação (400):**
```
Question not found for attempt ext-attempt-123
```

### 1.9 Código-fonte

| Arquivo | Descrição |
|---------|-----------|
| `app/api/sync/route.ts` | Endpoint principal de sincronização |
| `lib/zodSchemas.ts` | Schemas de validação Zod |
| `lib/prisma.ts` | Cliente Prisma singleton |
| `prisma/schema.prisma` | Modelos do banco de dados |

---

## Parte 2: Manual de Uso

### 2.1 Configuração Inicial

#### Passo 1: Definir a API Key (opcional, mas recomendado)

No servidor/Coolify, configure a variável de ambiente:
```
SYNC_API_KEY=sua-chave-secreta-aqui
```

#### Passo 2: Obter a URL da API

- **Produção:** `https://seu-dominio.com/api/sync`
- **Desenvolvimento:** `http://localhost:5000/api/sync`

### 2.2 Exemplos de Uso

#### Exemplo 1: Sincronizar Questões

```javascript
const response = await fetch('https://seu-dominio.com/api/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sua-chave-secreta'
  },
  body: JSON.stringify({
    questions: [
      {
        externalId: 'q-001',
        title: 'Soma de Frações',
        content: 'Quanto é 1/2 + 1/4?',
        topic: 'Frações',
        difficulty: 'EASY'
      },
      {
        externalId: 'q-002',
        title: 'Multiplicação',
        content: 'Quanto é 7 x 8?',
        topic: 'Multiplicação',
        difficulty: 'EASY'
      }
    ]
  })
});

const result = await response.json();
// { ok: true, questions: 2, solutionSteps: 0, attempts: 0, feedbacks: 0 }
```

#### Exemplo 2: Sincronizar Tentativas de Estudantes

```javascript
await fetch('https://seu-dominio.com/api/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sua-chave-secreta'
  },
  body: JSON.stringify({
    attempts: [
      {
        externalId: 'att-001',
        questionExternalId: 'q-001',  // Referência à questão
        studentName: 'Maria Silva',
        appUserId: 'user-123',
        correct: true,
        timeMs: 15000,
        attempts: 1,
        topic: 'Frações',
        difficulty: 'EASY'
      },
      {
        externalId: 'att-002',
        questionExternalId: 'q-001',
        studentName: 'João Santos',
        appUserId: 'user-456',
        correct: false,
        timeMs: 45000,
        attempts: 3,
        topic: 'Frações',
        difficulty: 'EASY'
      }
    ]
  })
});
```

#### Exemplo 3: Sincronizar Feedback

```javascript
await fetch('https://seu-dominio.com/api/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sua-chave-secreta'
  },
  body: JSON.stringify({
    feedbacks: [
      {
        externalId: 'fb-001',
        questionExternalId: 'q-001',
        studentName: 'Maria Silva',
        appUserId: 'user-123',
        rating: 5,
        comment: 'Questão muito boa e clara!'
      },
      {
        externalId: 'fb-002',
        // Feedback geral (sem questão específica)
        studentName: 'João Santos',
        appUserId: 'user-456',
        rating: 4,
        comment: 'O app é muito bom!'
      }
    ]
  })
});
```

#### Exemplo 4: Sincronização Completa (Batch)

```javascript
await fetch('https://seu-dominio.com/api/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sua-chave-secreta'
  },
  body: JSON.stringify({
    questions: [
      {
        externalId: 'q-003',
        title: 'Divisão',
        content: 'Quanto é 20 / 4?',
        topic: 'Divisão',
        difficulty: 'EASY'
      }
    ],
    solutionSteps: [
      {
        externalId: 'step-001',
        questionExternalId: 'q-003',
        order: 1,
        content: 'Divida 20 por 4'
      },
      {
        externalId: 'step-002',
        questionExternalId: 'q-003',
        order: 2,
        content: 'O resultado é 5'
      }
    ],
    attempts: [
      {
        externalId: 'att-003',
        questionExternalId: 'q-003',
        studentName: 'Ana Costa',
        correct: true,
        timeMs: 8000,
        topic: 'Divisão',
        difficulty: 'EASY'
      }
    ],
    feedbacks: [
      {
        externalId: 'fb-003',
        questionExternalId: 'q-003',
        studentName: 'Ana Costa',
        rating: 5,
        comment: 'Fácil de entender!'
      }
    ]
  })
});
```

### 2.3 Exemplo em Flutter/Dart

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class SyncService {
  final String apiUrl = 'https://seu-dominio.com/api/sync';
  final String apiKey = 'sua-chave-secreta';

  Future<Map<String, dynamic>> syncData({
    List<Map<String, dynamic>>? questions,
    List<Map<String, dynamic>>? attempts,
    List<Map<String, dynamic>>? feedbacks,
  }) async {
    final response = await http.post(
      Uri.parse(apiUrl),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: jsonEncode({
        if (questions != null) 'questions': questions,
        if (attempts != null) 'attempts': attempts,
        if (feedbacks != null) 'feedbacks': feedbacks,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Sync failed: ${response.body}');
    }
  }
}

// Uso:
final sync = SyncService();
await sync.syncData(
  attempts: [
    {
      'externalId': 'att-${DateTime.now().millisecondsSinceEpoch}',
      'questionExternalId': 'q-001',
      'studentName': 'Maria',
      'correct': true,
      'timeMs': 12000,
      'topic': 'Frações',
      'difficulty': 'EASY',
    }
  ],
);
```

### 2.4 Tratamento de Erros

| Código | Descrição | Solução |
|--------|-----------|---------|
| 401 | Unauthorized | Verifique se a API key está correta |
| 400 | Invalid payload | Verifique o formato do JSON e campos obrigatórios |
| 400 | Question not found | A questão referenciada não existe - sincronize as questões primeiro |
| 500 | Internal error | Erro no servidor - tente novamente |

### 2.5 Boas Práticas

1. **Use externalId únicos**
   - Combine timestamp + UUID para garantir unicidade
   - Exemplo: `q-${uuid}-${timestamp}`

2. **Sincronize questões primeiro**
   - Antes de enviar attempts/feedbacks, garanta que as questões existem

3. **Batch quando possível**
   - Agrupe múltiplos registros em uma única chamada
   - Reduz latência e overhead de rede

4. **Implemente retry com backoff**
   ```javascript
   async function syncWithRetry(data, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await sync(data);
       } catch (e) {
         if (i === maxRetries - 1) throw e;
         await delay(Math.pow(2, i) * 1000); // 1s, 2s, 4s
       }
     }
   }
   ```

5. **Armazene localmente antes de sincronizar**
   - Salve dados no dispositivo (SQLite, SharedPreferences)
   - Sincronize periodicamente ou quando houver conexão

6. **Monitore o retorno**
   - Verifique o campo `ok: true` na resposta
   - Confirme que os contadores correspondem ao enviado

### 2.6 Limites e Considerações

- **Tamanho máximo do payload:** Recomendado até 1MB por requisição
- **Registros por batch:** Recomendado até 100 registros por tipo
- **Rate limiting:** Não implementado, mas evite mais de 1 req/segundo
- **Timeout:** Configure timeout de 30 segundos no cliente

---

## Suporte

Para dúvidas ou problemas, verifique:
1. Logs do servidor (console do Coolify/Replit)
2. Formato do payload (use ferramentas como Postman para testar)
3. Variáveis de ambiente configuradas corretamente
