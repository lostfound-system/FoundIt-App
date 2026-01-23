export type Locations = {
    [country: string]: {
        [state: string]: {
            [city: string]: string[];
        };
    };
};

export const LOCATIONS: Locations = {
    "India": {
        "Gujarat": {
            "Ahmedabad": [
                "AU (Ahmedabad University)",
                "GU (Gujara t University)",
                "NU (Nirma University)",
                "CU (CEPT University)",
                "IIMA (Indian Institute of Management Ahmedabad)",
                "VGEC (Vishwakarma Government Engineering College)",
                "L.D. College of Engineering",
                "Silver Oak University",
                "Indus University",
                "KU (Karnavati University)",
                "GLS University",
                "ANU (Anant National University)",
                "SAL College of Engineering",
                "LJ University"
            ],
            "Gandhinagar": [
                "IITGN (Indian Institute of Technology Gandhinagar)",
                "PDEU (Pandit Deendayal Energy University)",
                "DA-IICT (Dhirubhai Ambani Institute of Information and Communication Technology)",
                "Adani University",
                "NFSU (National Forensic Sciences University)"
            ],
            "Baroda": [
                "MSU (Maharaja Sayajirao University of Baroda)",
                "Parul University",
                "Navrachana University"
            ],
            "Surat": [
                "SVNIT (Sardar Vallabhbhai National Institute of Technology)",
                "AURO University",
                "VNSGU (Veer Narmad South Gujarat University)"
            ]
        },
        "Maharashtra": {
            "Mumbai": [
                "IITB (Indian Institute of Technology Bombay)",
                "MU (University of Mumbai)",
                "TISS (Tata Institute of Social Sciences)",
                "NMIMS (National Institute of Management Studies)"
            ],
            "Pune": [
                "SPPU (Savitribai Phule Pune University)",
                "SIU (Symbiosis International University)",
                "MIT World Peace University",
                "DYPU (D Y Patil University)"
            ]
        },
        "Karnataka": {
            "Bengaluru": [
                "IISc (Indian Institute of Science)",
                "IIIT Bangalore",
                "Christ University"
            ]
        },
        "Delhi": {
            "New Delhi": [
                "IITD (Indian Institute of Technology Delhi)",
                "JNU (Jawaharlal Nehru University)",
                "DU (University of Delhi)",
                "JMI (Jamia Millia Islamia)"
            ]
        }
    }
    // Add other countries as needed
};
