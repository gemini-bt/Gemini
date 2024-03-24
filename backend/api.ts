// @ts-nocheck

import { FastifyInstance, FastifyServerOptions } from "fastify";
import db from "./db";
import { FastifyRouteConfig } from "fastify/types/route";
import { compile } from "./compile";

function parseCookies(str: string) {
  return str.split('; ').map((cookie) => {
    const [key, value] = cookie.split('=');
    return { key, value };
  });
}

export default async function API(
  fastify: FastifyInstance,

  options: FastifyRouteConfig,

  done: Function
) {
  fastify.setErrorHandler((error, request, reply) => {
    throw error;
  })

  fastify.post("/signup", async (request, reply) => {
    const { email, password, username, phone } = (request.body as { fields: any }).fields as {
      email: string[];
      password: string[];
      username: string[];
      phone: string[];
    };

    if (!email || !password || !username || !phone) {
      const error = {
        message: "Missing required fields",
        statusCode: 400, 
        fields: [email, password, username, phone].map((field, i) => {
          if (!field) return undefined;
        }).filter((field) => field !== undefined),
      }
      
      return reply.status(400).send(error);
    }

    if (await db.user.findFirst({ where: { email: email[0] } })) {
      const error = {
        message: "Email already in use",
        statusCode: 400,
      };

      return reply.status(400).send(error);
    }
    
    const user = await db.user.create({
      data: {
        username: username[0],
        phone: phone[0],
        email: email[0],
        password: password[0],
      },
    });

    reply.header('Set-Cookie', 
      `session=${user.id}; Path=/; SameSite=Strict; Expires=${new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toUTCString()}`,
    );

    reply.send(user);
  });

  fastify.post("/login", async (request, reply) => {
    try {
    const { email, password } = (request.body as { fields: any }).fields as {
      email: string[];
      password: string[];
    };

    if (!email[0] || !password[0]) {
      const error = {
        message: "Missing required fields",
        statusCode: 400,
        fields: [email[0], password[0]].map((field, i) => {
          if (!field) return undefined;
        }).filter((field) => field !== undefined),
      };

      return reply.status(400).send(error);
    }

    const user = await db.user.findFirst({
      where: {
        email: email[0],
        password: password[0],
      },
    });

    if (!user) {
      const error = {
        message: "Invalid credentials",
        statusCode: 401,
      };

      return reply.status(401).send(error);
    }

    reply.header('Set-Cookie', `session=${user.id}; Path=/; HttpOnly; SameSite=Strict; Expires=${new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toUTCString()}`);
    
    if ('goto' in (request.query as any)) {
      return reply.redirect((request.query as any).goto);
    }

    reply.redirect('/');
  } catch(e) {
    throw e;
  }
  });
  
  fastify.all("/competition/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const competition: any = await db.competition.findFirst({
      where: {
        id,
      },
    });

    if (!competition) {
      return reply.status(400).send({ message: "Competition not found", status: 400 });
    }

    competition.teams = await db.team.findMany({
      where: {
        competitionId: id,
      },
    });

    return reply.send(competition);
  });

  fastify.get('/create', async (request, reply) => {
    const cookies = parseCookies(request.headers.cookie || '');
    
    console.log(cookies);
    
    if (!cookies.find(cookie => cookie.key === 'session')) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const id = Math.random().toString(36).substring(7);

    await db.competition.create({
      data: {
        id,
        name: "New Contest",
        description: '',
        organizer: '',
        contact: '',
        status: 'draft',
        startDate: new Date(),
        endDate: new Date(),
      },
    });

    return reply.redirect(`/editor/${id}`);
  });

  fastify.post('/save', async (request, reply) => {
    try {

    const cookies = parseCookies(request.headers.cookie || '');

    if (!cookies.find(cookie => cookie.key === 'session')) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { id, banner, authorName, authorEmail, authorPicture, summary, rules, prizes, title } = (request.body as { fields: any }).fields as {
      id: string[];
      banner: string[];
      authorName: string[];
      authorEmail: string[];
      authorPicture: string[];
      summary: string[];
      prizes: string[];
      rules: string[];
      title: string[];
    };

    if (!id || !banner || !authorName || !authorEmail || !authorPicture || !summary || !rules || !prizes) {
      return reply.status(400).send({ message: 'Missing required fields' });
    }

    if (await db.competition.findFirst({ where: { id: id[0] } })) {
      const existing = await db.competition.findFirst({
        where: {
          id: id[0],
        },
      });

      const competition = await db.competition.update({
        where: {
          id: id[0],
        },
        data: {
          name: title[0] || existing?.name,
          description: summary[0] || existing?.description,
          organizer: authorName[0] || existing?.organizer,
          contact: authorEmail[0] || existing?.contact,
          rules: rules[0] || existing?.rules,
          banner: banner[0] || existing?.banner,
          prizes: prizes[0] || existing?.prizes,
          authorImg: authorPicture[0] || existing?.authorImg,
        },
      }).catch((e) => {
        console.error(e);
      });

      return reply.send(competition);
    } else {
      return reply.status(400).send({ message: 'Competition not found' });
    }
  } catch(e) {
    throw e;
  }
  });

  fastify.post('/publish', async (request, reply) => {
    try {
    const cookies = parseCookies(request.headers.cookie || '');

    if (!cookies.find(cookie => cookie.key === 'session')) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { id } = (request.body as { fields: any }).fields as {
      id: string[];
    };

    if (!id) {
      return reply.status(400).send({ message: 'Missing required fields' });
    }

    if (await db.competition.findFirst({ where: { id: id[0] } })) {
      const competition = await db.competition.update({
        where: {
          id: id[0],
        },
        data: {
          status: 'published',
        },
      });

      await compile(id[0]);

      return reply.send(competition);
    } else {
      return reply.status(400).send({ message: 'Competition not found' });
    }
  } catch(e) {
    throw e;
  }
  });

  fastify.post('/compile', async (request, reply) => {
    try {
    const cookies = parseCookies(request.headers.cookie || '');

    if (!cookies.find(cookie => cookie.key === 'session')) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { id } = (request.body as { fields: any }).fields as {
      id: string[];
    };

    if (!id) {
      return reply.status(400).send({ message: 'Missing required fields' });
    }

    if (await db.competition.findFirst({ where: { id: id[0] } })) {
      await compile(id[0]).catch((e) => {
        console.error(e);
      });

      return reply.send({ message: 'Compilation successful' });
    } else {
      return reply.status(400).send({ message: 'Competition not found' });
    }
  } catch(e) {
    throw e;
  }
  });

  fastify.post('/competitions/signup', async (request, reply) => {
    const { id, teamname } = (request.body as { fields: any }).fields as {
      id: string[];
      teamname: string[];
    };

    const session = parseCookies(request.headers.cookie || '').find(cookie => cookie.key === 'session');

    if (!session) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    if (!id || !teamname) {
      return reply.status(400).send({ message: 'Missing required fields' });
    }

    const competition = await db.competition.findFirst({
      where: {
        id: id[0],
      },
    });

    if (!competition) {
      return reply.status(400).send({ message: 'Competition not found' });
    }

    if (await db.team.findFirst({
      where: {
        competitionId: id[0],
        name: teamname[0],
      },
    })) {
      const current = await db.team.findFirst({
        where: {
          competitionId: id[0],
          name: teamname[0],
        },
      }) as any;

      
      await db.team.update({
        // @ts-ignore
        where: {
          competitionId: id[0],
          name: teamname[0],
          id: current.id
        },
        data: {
          members: {
            "connect": {
              id: parseInt(session.value),
            },
          },
        },
      });
    } else {
      // create team
      await db.team.create({
        data: {
          competitionId: id[0],
          name: teamname[0],
          members: {
            // @ts-ignore
            connect: {
              id: parseInt(session.value),
            },
          },
        },
      });
    }
  });
}
