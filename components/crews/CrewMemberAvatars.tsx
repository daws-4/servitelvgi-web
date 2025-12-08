"use client";

import React from "react";

interface CrewMember {
    _id: string;
    name: string;
    surname: string;
}

interface CrewMemberAvatarsProps {
    members: CrewMember[];
    maxDisplay?: number;
}

export const CrewMemberAvatars: React.FC<CrewMemberAvatarsProps> = ({
    members,
    maxDisplay = 3
}) => {
    const displayMembers = members.slice(0, maxDisplay);
    const remainingCount = Math.max(0, members.length - maxDisplay);

    return (
        <div className="flex -space-x-2 overflow-hidden">
            {displayMembers.map((member) => (
                <img
                    key={member._id}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        `${member.name} ${member.surname}`
                    )}&background=random`}
                    alt={`${member.name} ${member.surname}`}
                    title={`${member.name} ${member.surname}`}
                />
            ))}
            {remainingCount > 0 && (
                <div className="h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-bold text-neutral">
                    +{remainingCount}
                </div>
            )}
        </div>
    );
};
