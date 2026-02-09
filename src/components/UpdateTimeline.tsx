'use client';

import React, { useEffect, useState } from 'react';

interface UpdateItem {
    update_id: number;
    update_date: string;
    update_description: string;
    update_version?: string;
}

const UpdateTimeline: React.FC = () => {
    const [updates, setUpdates] = useState<UpdateItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUpdates();
    }, []);

    const fetchUpdates = async () => {
        try {
            const res = await fetch('/api/updates');
            if (res.ok) {
                const data = await res.json();
                setUpdates(data);
            }
        } catch (error) {
            console.error('Error fetching updates:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateThai = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear() + 543;
        return `${day}/${month}/${year}`;
    };

    if (loading) {
        return <div className="text-center py-4 text-gray-500">กำลังโหลดข้อมูล...</div>;
    }

    if (updates.length === 0) {
        return null;
    }

    return (
        <div className="w-full bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30">
            <h2 className="text-xl font-bold text-[#8E24AA] mb-4 flex items-center gap-2">
                <i className="ph-duotone ph-megaphone-simple text-2xl"></i>
                ข่าวสารอัปเดต
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {updates.map((update) => (
                    <div key={update.update_id} className="relative pl-4 border-l-2 border-[#8E24AA]/30">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#8E24AA] border-2 border-white"></div>
                        <div className="mb-1 text-sm font-semibold text-[#6A1B9A]">
                            {formatDateThai(update.update_date)}
                            {update.update_version && (
                                <span className="ml-2 opacity-60 text-xs text-[#8E24AA]">
                                    ({update.update_version})
                                </span>
                            )}
                        </div>
                        <div className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                            {update.update_description}
                        </div>
                    </div>
                ))}
            </div>
            {/* Custom Scrollbar Styles */}
            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(142, 36, 170, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(142, 36, 170, 0.5);
        }
      `}</style>
        </div>
    );
};

export default UpdateTimeline;
