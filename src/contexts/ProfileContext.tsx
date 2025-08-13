
"use client";

import { createContext, useState, useContext, Dispatch, SetStateAction } from "react";
import type { UserProfile } from "@/app/dashboard/layout";

interface ProfileContextType {
    activeProfile: UserProfile;
    setActiveProfile: Dispatch<SetStateAction<UserProfile>>;
}

const defaultProfileContext: ProfileContextType = {
    activeProfile: 'Admin',
    setActiveProfile: () => {},
};

export const ProfileContext = createContext<ProfileContextType>(defaultProfileContext);

export const ProfileProvider = ({ children, value }: { children: React.ReactNode, value: ProfileContextType }) => {
    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};

    