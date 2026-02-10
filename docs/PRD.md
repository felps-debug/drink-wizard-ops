# 📋 Product Requirements Document (PRD): Mago dos Drinks

## 1. Metas e Contexto de Fundo
* [cite_start]**Objetivo:** Estabelecer clareza financeira total e eficiência operacional para a Mago dos Drinks através de dados reais de consumo e custos[cite: 507].
* [cite_start]**Visão:** Transformar a operação manual em um sistema inteligente que garante uma margem de lucro real de 30%[cite: 508].
* [cite_start]**Contexto:** Atualmente, a empresa sofre com a falta de controle sobre sobras de eventos e variações semanais de custos de insumos, como frutas e bebidas[cite: 508].

## 2. Registro de Alterações (Change Log)
| Data       | Versão | Descrição                         | Autor     |
| :--------- | :----- | :-------------------------------- | :-------- |
| 05/02/2026 | 1.0    | Criação do PRD inicial (Modo YOLO) | John (PM) |

## 3. Requisitos Funcionais (FR)
* [cite_start]**FR1 - Gestão de Insumos:** O sistema deve permitir o cadastro de itens e a atualização **semanal** de seus preços de custo[cite: 509].
* [cite_start]**FR2 - Checklists de Evento:** Interface para o Chefe de Bar realizar conferência de entrada (materiais enviados) e saída (sobras do evento)[cite: 510].
* [cite_start]**FR3 - Escala de Bartenders:** Módulo para bartenders informarem disponibilidade e o administrador gerir e enviar escalas via WhatsApp[cite: 533].
* [cite_start]**FR4 - Automação WhatsApp (Cliente):** Disparo automático de mensagens de status como "Festa em montagem" e "Festa a caminho"[cite: 512].
* [cite_start]**FR5 - Cálculo de Lucratividade:** Relatório automático comparando o Valor do Contrato menos o Consumo Real (baseado no Preço da Semana) e Custos Fixos/Logística[cite: 535].
* [cite_start]**FR6 - Histórico Semestral:** Acúmulo de dados por 6 meses para servir de base sólida para o reajuste dos pacotes de serviços[cite: 536].

## 4. Requisitos Não Funcionais (NFR)
* [cite_start]**NFR1 - Usabilidade Mobile:** A interface deve ser otimizada para uso em celulares, com baixa carga cognitiva para operação rápida durante os eventos[cite: 510].
* [cite_start]**NFR2 - Arquitetura Web:** Sistema Web Responsivo (PWA) para evitar a necessidade de downloads em lojas de aplicativos[cite: 519].
* [cite_start]**NFR3 - Segurança e Acesso:** Níveis de acesso distintos, onde apenas o Administrador visualiza lucros e custos fixos (pro-labore, manutenção)[cite: 630].

## 5. Suposições Técnicas
* [cite_start]**Plataforma:** Fullstack com banco de dados relacional para gerir o histórico de preços e checklists[cite: 521].
* [cite_start]**Integração:** Uso de APIs de terceiros para automação de mensagens via WhatsApp[cite: 522].
* [cite_start]**Custos Operacionais:** Inclusão de gastos com gasolina e manutenção de veículos no cálculo de ROI por evento[cite: 523].

## 6. Lista de Épicos
* [cite_start]**Épico 1: Fundação e Infraestrutura:** Configuração do ambiente, banco de dados e autenticação inicial[cite: 527].
* [cite_start]**Épico 2: Gestão de Insumos e Logística:** Cadastro de estoque, preços semanais e fluxo de WhatsApp para o cliente[cite: 533].
* [cite_start]**Épico 3: Operação de Bar e Checklists:** Interface do Chefe de Bar para conferência de materiais e sobras[cite: 533].
* [cite_start]**Épico 4: Financeiro e Inteligência de Dados:** Relatórios de lucro real e consolidação de dados para reajuste semestral[cite: 533].