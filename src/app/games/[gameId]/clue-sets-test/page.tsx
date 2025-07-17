'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'

interface Location {
    lat: number
    lng: number
}

interface ClueSet {
    id: string
    name: string
    description?: string
    center: Location
    radius: string
    participantCount?: number
    participants?: string[]
}

export default function ClueSetTestPage() {
    const params = useParams()
    const gameId = params.gameId as string

    const [location, setLocation] = useState<Location>({ lat: 0, lng: 0 })
    const [results, setResults] = useState<{
        result?: string
        clueSet?: ClueSet
        clueSets?: ClueSet[]
        message?: string
        error?: string
    } | null>(null)
    const [loading, setLoading] = useState(false)
    const [clueSets, setClueSets] = useState<ClueSet[]>([])

    const testLocations = [
        { name: 'Marion District, Calabar', lat: 4.9518, lng: 8.3229 },
        { name: 'Marina Area, Calabar', lat: 4.9545, lng: 8.3156 },
        { name: 'Downtown Calabar', lat: 4.9497, lng: 8.3263 },
        { name: 'University of Calabar', lat: 4.9000, lng: 8.3500 },
        { name: 'Far Location (Lagos)', lat: 6.5244, lng: 3.3792 }
    ]

    const performAction = async (action: string) => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/games/${gameId}/clue-sets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`
                },
                body: JSON.stringify({
                    lat: location.lat,
                    lng: location.lng,
                    action
                })
            })

            const data = await response.json()
            setResults(data)

            // If we listed clue sets, update the state
            if (data.clueSets) {
                setClueSets(data.clueSets)
            }
        } catch (error) {
            console.error('Error:', error)
            setResults({ error: 'Failed to perform action' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Clue Set Geolocation Testing
                </h1>

                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Test Location</h2>

                    {/* Quick test locations */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quick Test Locations:
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {testLocations.map((testLoc, index) => (
                                <button
                                    key={index}
                                    onClick={() => setLocation(testLoc)}
                                    className="text-left p-2 border border-gray-200 rounded hover:bg-gray-50"
                                >
                                    <div className="font-medium">{testLoc.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {testLoc.lat.toFixed(4)}, {testLoc.lng.toFixed(4)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Manual input */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Latitude
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                value={location.lat}
                                onChange={(e) => setLocation({ ...location, lat: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Longitude
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                value={location.lng}
                                onChange={(e) => setLocation({ ...location, lng: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2">
                        <button
                            onClick={() => performAction('test-assignment')}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Testing...' : 'Test Clue Set Assignment'}
                        </button>

                        <button
                            onClick={() => performAction('create-test-clue-set')}
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Test Clue Set'}
                        </button>

                        <button
                            onClick={() => performAction('list-clue-sets')}
                            disabled={loading}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'List All Clue Sets'}
                        </button>
                    </div>
                </div>

                {/* Results */}
                {results && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Results</h2>
                        <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                            {JSON.stringify(results, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Clue Sets List */}
                {clueSets.length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            Current Clue Sets ({clueSets.length})
                        </h2>
                        <div className="space-y-4">
                            {clueSets.map((clueSet) => (
                                <div key={clueSet.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg">{clueSet.name}</h3>
                                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {clueSet.participantCount || 0} participants
                                        </span>
                                    </div>

                                    {clueSet.description && (
                                        <p className="text-gray-600 mb-2">{clueSet.description}</p>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <strong>Center:</strong> {clueSet.center.lat.toFixed(4)}, {clueSet.center.lng.toFixed(4)}
                                        </div>
                                        <div>
                                            <strong>Radius:</strong> {clueSet.radius}
                                        </div>
                                    </div>

                                    {clueSet.participants && clueSet.participants.length > 0 && (
                                        <div className="mt-2">
                                            <strong>Participants:</strong> {clueSet.participants.join(', ')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                    <h2 className="text-lg font-semibold text-blue-900 mb-2">
                        How to Test the Geolocation System
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-blue-800">
                        <li>Select a test location or enter coordinates manually</li>
                        <li>Click &quot;Test Clue Set Assignment&quot; to see if there&apos;s an existing clue set</li>
                        <li>If no clue set exists, click &quot;Create Test Clue Set&quot; to create one</li>
                        <li>Try different locations to test the overlap prevention system</li>
                        <li>Use &quot;List All Clue Sets&quot; to see all current clue sets</li>
                    </ol>

                    <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
                        <strong>Example Test Scenario:</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                            <li>Create a clue set at &quot;Marion District, Calabar&quot;</li>
                            <li>Test assignment at &quot;Marina Area, Calabar&quot; (close by - should use existing)</li>
                            <li>Create another at &quot;University of Calabar&quot; (far enough - new clue set)</li>
                            <li>Test a location between them to see overlap prevention</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    )
}
