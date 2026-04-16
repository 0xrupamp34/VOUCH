import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./typeDefs";
import { resolvers } from "./resolvers";
import { authMiddleware, checkAuth } from "../middleware/auth";
import { logger } from "../utils/logger";

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export const apolloServer = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== "production",
  formatError: (error) => {
    logger.error("GraphQL Error:", {
      message: error.message,
      path: error.path,
      extensions: error.extensions,
    });

    return {
      message: error.message,
      path: error.path,
      extensions: error.extensions,
    };
  },
  plugins: [
    {
      async serverWillStart() {
        logger.info("Apollo Server starting...");
      },
      async serverWillStop() {
        logger.info("Apollo Server stopping...");
      },
    },
  ],
});

export async function startApolloServer() {
  await apolloServer.start();
  
  return expressMiddleware(apolloServer, {
    context: async ({ req }) => {
      const user = await authMiddleware(req);
      return {
        user,
        req,
      };
    },
  });
}
