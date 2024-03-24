import db from './db';

await db.user.delete({
    where: {
        email: 'a@mong.us'
    },
});