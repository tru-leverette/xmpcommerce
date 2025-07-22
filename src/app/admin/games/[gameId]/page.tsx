import ProtectedRouteGuard from '@/components/ProtectedRouteGuard';
import { getGameProgress } from '@/lib/gameProgressManager';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function AdminGamePage({ params }: { params: { gameId: string } }) {
    const game = await prisma.game.findUnique({
        where: { id: params.gameId },
        include: {
            levels: { include: { stages: true } },
            clueSets: true,
            participants: true,
        }
    });
    if (!game) return <div>Game not found</div>;

    const progress = await getGameProgress(game.id);

    return (
        <ProtectedRouteGuard requiredRole={['ADMIN', 'SUPERADMIN']}>
            <main className="p-8">
                <nav className="mb-6 text-sm text-gray-600">
                    <Link href="/admin" className="hover:underline">Admin</Link>
                    <span className="mx-2">{'>'}</span>
                    <span className="font-semibold">{game.title}</span>
                </nav>
                <h1 className="text-2xl font-bold mb-4">{game.title}</h1>
                <section className="mb-6">
                    <h2 className="text-xl font-semibold">Progression</h2>
                    {progress ? (
                        <div>
                            <div>Phase: {progress.phase}</div>
                            <div>Level: {progress.levelId ?? 'N/A'}</div>
                            <div>Stage: {progress.stageId ?? 'N/A'}</div>
                        </div>
                    ) : (
                        <div>No progression data.</div>
                    )}
                </section>
                <section className="mb-6">
                    <h2 className="text-xl font-semibold">Levels & Stages</h2>
                    <ul>
                        {game.levels.map(level => (
                            <li key={level.id}>
                                Level {level.levelNumber}
                                <ul>
                                    {level.stages.map(stage => (
                                        <li key={stage.id}>Stage {stage.stageNumber}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </section>
                <section className="mb-6">
                    <h2 className="text-xl font-semibold">Clue Sets</h2>
                    <ul>
                        {game.clueSets.map(cs => (
                            <li key={cs.id}>{cs.name} ({cs.centerLatitude}, {cs.centerLongitude})</li>
                        ))}
                    </ul>
                </section>
                <section>
                    <h2 className="text-xl font-semibold">Participants</h2>
                    <ul>
                        {game.participants.map(p => (
                            <li key={p.id}>{p.id}</li>
                        ))}
                    </ul>
                </section>
            </main>
        </ProtectedRouteGuard>
    );
}