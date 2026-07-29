# Projeto Social Mão com Mão

Site institucional desenvolvido em Next.js, React e Tailwind CSS para o Projeto Social Mão com Mão, de Diadema (SP).

## Funcionalidades

- Layout responsivo para celular, tablet e computador
- Menu móvel
- Seções de apresentação, impacto social, aulas, ações, equipe e galeria
- Áreas de patrocínio, doação e transparência
- Formulário de contato demonstrativo
- SEO básico
- Exportação estática para hospedagem gratuita

## Executar no computador

1. Instale o Node.js 20 ou superior.
2. Abra o terminal dentro da pasta do projeto.
3. Execute:

```bash
npm install
npm run dev
```

4. Abra `http://localhost:3000`.

## Gerar versão estática

```bash
npm install
npm run build
```

A pasta `out` será criada e poderá ser enviada para uma hospedagem estática.

## Publicar pela Vercel

1. Envie os arquivos deste projeto para um repositório GitHub.
2. Entre na Vercel e escolha **Add New Project**.
3. Importe o repositório.
4. A Vercel identificará o Next.js automaticamente.
5. Clique em **Deploy**.

## Dados que precisam ser confirmados antes da publicação oficial

- WhatsApp e e-mail institucionais
- Chave PIX ou plataforma de doação
- Endereço completo das aulas
- Redes sociais
- Documentos de transparência
- Fotografias oficiais e autorizações de uso de imagem
- Números atualizados de alunos, famílias e doações

## Estrutura principal

```text
app/
components/
public/images/
package.json
README.md
```
