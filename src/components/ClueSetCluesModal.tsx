import React from 'react';

export interface Clue {
    id: string;
    clueNumber: number;
    question: string;
    answer: string;
    hint?: string;
    type: string;
}

interface ClueSetCluesModalProps {
    open: boolean;
    onClose: () => void;
    clues: Clue[];
    clueSetName: string;
}

const ClueSetCluesModal: React.FC<ClueSetCluesModalProps> = ({ open, onClose, clues, clueSetName }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>
                <h2 className="text-xl font-bold mb-4">Clues for {clueSetName}</h2>
                <ul className="space-y-4">
                    {clues.map(clue => (
                        <li key={clue.id} className="border-b pb-2">
                            <div className="font-semibold">Q{clue.clueNumber}: {clue.question}</div>
                            <div className="text-sm text-gray-600">Answer: <span className="font-mono">{clue.answer || <em>(none)</em>}</span></div>
                            {clue.hint && <div className="text-xs text-gray-500">Hint: {clue.hint}</div>}
                            <div className="text-xs text-gray-400">Type: {clue.type}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ClueSetCluesModal;
