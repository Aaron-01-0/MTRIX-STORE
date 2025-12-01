export interface ArenaDesign {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    image_url: string;
    mockup_url: string | null;
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'voting' | 'paused';
    voting_period_id: string | null;
    votes_count: number;
    views_count: number;
    category: string | null;
    tags: string[] | null;
    created_at: string;
    profiles?: {
        name: string;
        avatar_url: string | null;
    };
    has_voted?: boolean; // Virtual field for UI
}

export interface VotingPeriod {
    id: string;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'active' | 'ended';
}
