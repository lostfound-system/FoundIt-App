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
                "Ahmedabad University",
                "Gujarat University",
                "Nirma University",
                "CEPT University",
                "Indian Institute of Management Ahmedabad (IIMA)",
                "Vishwakarma Government Engineering College (VGEC)",
                "L.D. College of Engineering",
                "Silver Oak University",
                "Indus University",
                "Karnavati University",
                "GLS University",
                "Anant National University",
                "Sals College of Engineering",
                "LJ University"
            ],
            "Gandhinagar": [
                "Indian Institute of Technology Gandhinagar (IITGN)",
                "Pdpu (Pandit Deendayal Energy University)",
                "Dhirubhai Ambani Institute of Information and Communication Technology (DA-IICT)",
                "Adani University",
                "National Forensic Sciences University (NFSU)"
            ],
            "Baroda": [
                "Maharaja Sayajirao University of Baroda",
                "Parul University",
                "Navrachana University"
            ],
            "Surat": [
                "Sardar Vallabhbhai National Institute of Technology (SVNIT)",
                "AURO University",
                "Veer Narmad South Gujarat University"
            ]
        },
        "Maharashtra": {
            "Mumbai": [
                "Indian Institute of Technology Bombay (IITB)",
                "University of Mumbai",
                "Tata Institute of Social Sciences (TISS)",
                "NMIMS"
            ],
            "Pune": [
                "Savitribai Phule Pune University",
                "Symbiosis International University",
                "MIT World Peace University"
            ]
        },
        "Karnataka": {
            "Bengaluru": [
                "Indian Institute of Science (IISc)",
                "IIIT Bangalore",
                "Christ University"
            ]
        },
        "Delhi": {
            "New Delhi": [
                "Indian Institute of Technology Delhi (IITD)",
                "Jawaharlal Nehru University (JNU)",
                "University of Delhi",
                "Jamia Millia Islamia"
            ]
        }
    }
    // Add other countries as needed
};
