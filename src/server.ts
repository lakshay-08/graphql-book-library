// Import required packages
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { Pool } from 'pg';

// Initialize Express app
const app = express();
const PORT = 4000;

// PostgreSQL connection setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 5432,
});

// GraphQL schema
// define the types and queries/mutations
const schema = buildSchema(`
  type Book {
    id: ID!
    title: String!
    author: String!
    publishedYear: Int
  }

  type Query {
    getBooks: [Book]
    getBook(id: ID!): Book
  }

  type Mutation {
    addBook(title: String!, author: String!, publishedYear: Int): Book
    deleteBook(id: ID!): String
  }
`);

// Resolvers
const root = {
  getBooks: async (): Promise<{ id: number; title: string; author: string; publishedYear: number }[]> => {
    const { rows } = await pool.query('SELECT * FROM books');
    return rows;
  },
  getBook: async ({ id }: { id: string }): Promise<{ id: number; title: string; author: string; publishedYear: number } | null> => {
    const { rows } = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    return rows[0] || null;
  },
  addBook: async ({ title, author, publishedYear }: { title: string; author: string; publishedYear: number }): Promise<{ id: number; title: string; author: string; publishedYear: number }> => {
    const { rows } = await pool.query(
      'INSERT INTO books (title, author, published_year) VALUES ($1, $2, $3) RETURNING *',
      [title, author, publishedYear]
    );
    return rows[0];
  },
  deleteBook: async ({ id }: { id: string }): Promise<string> => {
    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    return `Book with id ${id} deleted.`;
  },
};

// Middleware
app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true, // Enable GraphiQL for testing
}));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/graphql`);
});
