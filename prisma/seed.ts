import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create a test user (if not exists)
    const user = await prisma.user.upsert({
        where: { email: 'testuser@example.com' },
        update: {},
        create: {
            email: 'testuser@example.com',
            username: 'testuser',
            password: 'testpassword', // Replace with hashed password in production
        },
    });

    // Create a game in UPCOMING state
    const game = await prisma.game.create({
        data: {
            title: 'Sample Scavenger Hunt',
            description: 'A seeded scavenger hunt game for testing.',
            location: 'Test Location',
            status: 'UPCOMING',
            creatorId: user.id,
            // Optional: set launchDate, region, etc. as needed
        },
    });

    console.log('Seeded user and game:', { user, game });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
