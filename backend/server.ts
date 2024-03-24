import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import api from "./api";
import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import db from './db';
const server = fastify();

function parseCookies(str: string) {
  return str.split('; ').map((cookie) => {
    const [key, value] = cookie.split('=');
    return { key, value };
  });
}

// @ts-ignore
server.register(api, { prefix: "/api" });

server.get("/editor", async (request, reply) => {
  if (request.headers.cookie) {
    const cookies = parseCookies(request.headers.cookie);

    if (cookies.some((cookie) => cookie.key === "session")) {
      return reply.redirect("/editor/create");
    }
  }

  reply.redirect('/login?gogo=/editor');
});

server.get("/editor/create", async (request, reply) => {
  reply.redirect("/api/create");
});

server.get("/editor/:id", async (request: {params: any}, reply) => {
  if (request.params.id === "create") {
    return reply.send("create")
  }

  reply.header("Content-Type", "text/html");
  reply.header("Content-Length", "")
  reply.send(await fs.readFile(path.join(__dirname, "../", "public", "/editor.html")));
});

server.get("/login", async (request, reply) => {
  reply.header("Content-Type", "text/html");
  reply.send(await fs.readFile(path.join(__dirname, "../", "public", "/login.html")));
});

server.get("/register", async (request, reply) => {
  reply.header("Content-Type", "text/html");
  reply.send(await fs.readFile(path.join(__dirname, "../", "public", "/sign_up.html")));
});

server.all('/competitions/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const competition = await db.competition.findFirst({
      where: {
        id,
      },
    }).catch(e => {
      console.error(e);
    });

    if (!competition) {
      return reply.send({ message: "Competition not found", status: 400 });
    }

    reply.header("Content-Type", "text/html; charset=utf-8");
    return reply.send(await fs.readFile(__dirname + `/compiled/${id}/index.html`));
  } catch(e) {
    console.error(e);
  }
});

server.register(fastifyStatic, {
  root: path.resolve(__dirname, "../", "public"),
});

server.addContentTypeParser("application/x-www-form-urlencoded", function (request, payload, done) {
  const form = new IncomingForm();
  
  // @ts-ignore
  form.parse(request.raw, (err, fields, files) => {
    if (err) {
      done(err);
      return;
    }

    done(null, { fields, files });
  });
});

server.addContentTypeParser(/multipart\/form\-data.*/, function (request, payload, done) {
  const form = new IncomingForm();
  
  // @ts-ignore
  form.parse(request.raw, (err, fields, files) => {
    if (err) {
      done(err);
      return;
    }

    done(null, { fields, files });
  });
});

server.addContentTypeParser('*', function (request, payload, done) {
  var data = '';
  payload.on('data', chunk => { data += chunk });
  payload.on('end', () => {
    done(null, data)
  });
});

server.listen(
  {
    port: 3000,
    host: "0.0.0.0",
  },

  (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  }
);
