

Templet 1 


\documentclass[letterpaper,10pt]{article} % Smaller font size
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage{hyperref}
\hypersetup{colorlinks=true,urlcolor=blue}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{fontawesome}

% === FONT CHANGE FOR READABILITY ===
\usepackage{lmodern}
\renewcommand{\familydefault}{\sfdefault} % Switches to Sans-Serif (Latin Modern Sans) for better on-screen readability
% ===================================

% Adjust margins to fit on one page
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1.0in}
\addtolength{\topmargin}{-0.75in}
\addtolength{\textheight}{1.5in}

\pagestyle{empty}

% Section formatting
\titleformat{\section}{\large\scshape\raggedright}{}{0em}{}[\titlerule] % Smaller section title font
\titlespacing{\section}{0pt}{8pt}{8pt} % Reduced spacing around sections

% Custom commands
\newcommand{\resumetitle}[1]{%
    \vspace{4pt} % Reduced space before the title
    \textbf{#1}
}

\begin{document}

%--------------------HEADING--------------------
\begin{center}
    \textbf{\Large Lokesh Goswami}
    \vspace{3pt}
    
    \small \href{mailto:lokesh.goswami.2003@gmail.com}{\faEnvelope\ lokesh.goswami.2003@gmail.com} \textperiodcentered\ \faPhone\ +917017095682 \textperiodcentered\ Faridabad \textperiodcentered\ \href{https://www.linkedin.com/in/lokeshgoswami/}{\faLinkedin\ LinkedIn} \textperiodcentered\ \href{https://github.com/LokeshGoswami2003}{\faGithub\ GitHub} \textperiodcentered\ \href{https://leetcode.com/u/Lokesh_Goswami/}{\faLink\ LeetCode}
\end{center}

%--------------------SUMMARY--------------------
\section{Summary}
\item B.Tech CSE graduate with hands-on experience in MERN stack development, REST APIs, and cloud deployment. Built a full-stack social media application using MongoDB, Express, React, and Node.js with features like authentication, API integration, and frontend–backend connectivity. Developed a real-time data-fetching project using Swiggy’s APIs, working with complex JSON schemas and resolving CORS issues by creating a custom proxy server on Google Cloud VM using Nginx. Experienced with GitHub Actions, CI/CD pipelines, Linux, and deploying applications on cloud infrastructure. Strong problem-solving skills, fast learner, and eager to contribute to full-stack roles.

%--------------------TECHNICAL SKILLS--------------------
\section{Technical Skills}
\begin{itemize}[leftmargin=*,itemsep=1pt,parsep=0pt,partopsep=0pt]
    \item \textbf{Languages:} JavaScript, TypeScript, Java, C++
    \item \textbf{Web Development:} React.js, Node.js, Express.js, HTML, CSS, RESTful APIs
    \item \textbf{Databases:} MongoDB, MySQL
    \item \textbf{Cloud:} AWS (EC2, Lambda, S3), Firebase,Google Cloud (Compute Engine)
    \item \textbf{Tools:} Git, Docker, Nginx
    \item \textbf{Methodologies:} Agile, Scrum, CI/CD
\end{itemize}

%--------------------PROJECTS--------------------
\section{Projects}
\item\resumetitle{Social-Media Platform} \hfill \href{https://github.com/LokeshGoswami2003/Social-Media}{GitHub} | \href{https://www.youtube.com/watch?v=0d_LtS0-k4Y}{YouTube} | \href{https://samvad.space/login}{Live} 
\begin{itemize}[leftmargin=*,itemsep=1pt,parsep=0pt,partopsep=0pt]
\item Built a full-stack social media platform using \textbf{ReactJS, Node.js, Express, MongoDB} with 
\textbf{25+ RESTful APIs} covering posts, users, likes, comments, and follow system.

\item Implemented secure authentication and authorization using \textbf{JWT, bcrypt}, and custom middleware 
for validation, error handling, and rate limiting, ensuring stable and protected API access.

\item Integrated \textbf{Cloudinary} for optimized media uploads with auto-compression and caching, 
reducing image load times by \textbf{20–25\%}.

\item Improved API reliability by \textbf{30\%} using Axios interceptors and designed a scalable MongoDB 
schema with indexing to boost feed and profile loading performance by \textbf{~40\%}.

\item Developed structured backend logic and reusable frontend components to ensure clean architecture, 
maintainability, and consistent data flow across the application.

\end{itemize}

\item\resumetitle{MunchMob Swiggy Clone} \hfill \href{https://github.com/LokeshGoswami2003/munchmob}{GitHub} | \href{https://drive.google.com/drive/u/0/folders/1d8irEFI7xwOwOOJ3aX6wI8lz4ggG3gpc?lfhs=2}{Snapshots}
\begin{itemize}[leftmargin=*,itemsep=1pt,parsep=0pt,partopsep=0pt]
    \item Developed a fast, responsive \textbf{ReactJS/Hooks} interface to fetch and display 
    real-time restaurant and menu data by reverse-engineering complex 
    \textbf{Swiggy API JSON schemas}, improving data extraction accuracy by 
    \textbf{~40\%}.

    \item Designed a custom \textbf{Node.js/Express} proxy server to fully bypass 
    \textbf{CORS restrictions}, eliminating \textbf{100\%} of browser-level CORS failures 
    and enabling stable cross-origin data fetching.

    \item Deployed the entire backend on a \textbf{Google Cloud VM} and configured 
    \textbf{Nginx + custom domain + HTTPS}, increasing API reliability and uptime to 
    \textbf{99\%+} during testing.

    \item Implemented efficient client-side data fetching using \textbf{Axios} with 
    interceptors, reducing redundant network requests by \textbf{25–30\%}.

    \item Optimized parsing logic for large, nested JSON responses, reducing 
    processing time by \textbf{35\%} and enabling smoother real-time UI updates.

    % \item Structured reusable components and custom hooks to improve 
    % maintainability, reducing frontend code complexity by \textbf{~20\%}.
\end{itemize}

\item\resumetitle{The Game Room – Real-Time Tic Tac Toe (Group Project)} \hfill \href{https://github.com/LokeshGoswami2003/TheGameRoom}{GitHub} | \href{https://www.youtube.com/watch?v=RACu1zRwCg4}{YouTube}
\begin{itemize}[leftmargin=*,itemsep=1pt,parsep=0pt,partopsep=0pt]
     \item Designed and implemented key \textbf{ReactJS} components for the real-time
    Tic Tac Toe interface—board, turn indicators, and result modals—improving UI
    responsiveness by \textbf{~25\%} during internal testing.

    \item Built interactive UI elements and managed game state using 
    \textbf{React Hooks}, reducing unnecessary re-renders by \textbf{30\%} and 
    enhancing overall smoothness of gameplay.

    \item Collaborated closely with teammates handling \textbf{Socket.io} and backend 
    game logic, ensuring seamless UI–server synchronization and reducing user-side 
    state mismatches by \textbf{~40\%}.

    % \item Contributed to a polished, mobile-responsive gaming interface, which 
    % improved user engagement and playthrough completion rate by \textbf{20\%}.
\end{itemize}

%--------------------EDUCATION--------------------
\section{Education}
\vspace{0em} % This pulls the content up closer to the heading
\begin{itemize}[leftmargin=*,itemsep=1pt,parsep=0pt,partopsep=0pt]
    \item \textbf{B.Tech in Computer Science and Engineering} \hfill \hspace{-130pt} GLA University, Mathura  \hfill 2024
    \item \textbf{Senior Secondary (Class 12)} \hfill Saraswati Vidya Mandir, Kosi Kalan \hfill 2020
\end{itemize}


%--------------------ACHIEVEMENTS & CERTIFICATIONS--------------------
\section{Achievements \& Certifications}
\begin{itemize}[leftmargin=*,itemsep=1pt,parsep=0pt,partopsep=0pt]
\item Solved \textbf{200+ DSA problems} on LeetCode and  completed DSA from \textbf{Coding Ninjas} 
\hfill \href{https://drive.google.com/file/d/12pCcUQ2nwlFkDHPjgyrbpWKoztH-vXxf/view}{Certificate}

\item Built multiple full-stack MERN projects and completed the \textbf{CodingShuttle Full-Stack Development Course}
\hfill \href{https://drive.google.com/file/d/15MSY8JEBfFA9dDpaCmtxIQMNNrNmUc1J/view}{Certificate}

\end{itemize}

\end{document} 


Templet 2 


\documentclass[letterpaper,10pt]{article} % Smaller font size
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage{hyperref}
\hypersetup{colorlinks=true,urlcolor=blue}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{fontawesome}

% === FONT CHANGE FOR READABILITY ===
\usepackage{lmodern}
\renewcommand{\familydefault}{\sfdefault} % Switches to Sans-Serif (Latin Modern Sans) for better on-screen readability
% ===================================

% Adjust margins to fit on one page
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1.0in}
\addtolength{\topmargin}{-0.75in}
\addtolength{\textheight}{1.5in}

\pagestyle{empty}

% Section formatting
\titleformat{\section}{\large\scshape\raggedright}{}{0em}{}[\titlerule] % Smaller section title font
\titlespacing{\section}{0pt}{5pt}{4pt} % Reduced spacing around sections

% Custom commands
\newcommand{\resumetitle}[1]{%
    \vspace{2pt} % Reduced space before the title
    \textbf{#1}
}

\begin{document}

%--------------------HEADING--------------------
\begin{center}
    \textbf{\Large Lokesh Goswami}
    \vspace{3pt}
    
    \small \href{mailto:lokesh.goswami.2003@gmail.com}{\faEnvelope\ lokesh.goswami.2003@gmail.com} \textperiodcentered\ \faPhone\ +917017095682 \textperiodcentered\ Hyderabad \textperiodcentered\ \href{https://www.linkedin.com/in/lokeshgoswami/}{\faLinkedin\ LinkedIn} \textperiodcentered\ \href{https://github.com/LokeshGoswami2003}{\faGithub\ GitHub} \textperiodcentered\ \href{https://leetcode.com/u/Lokesh_Goswami/}{\faLink\ LeetCode}
\end{center}

%--------------------SUMMARY--------------------
\section{Summary}
\item Software Development Intern and B.Tech CSE graduate with hands-on experience in \textbf{microservices, REST APIs, WebSockets, API Gateway, API authentication, React, Node.js, MongoDB, and cloud deployment}. Built scalable backend services, real-time applications, and full-stack products, with exposure to hierarchy-based systems, third-party integrations, and configurable business logic.

%--------------------TECHNICAL SKILLS--------------------
\section{Technical Skills}
\begin{itemize}[leftmargin=*,itemsep=0pt,topsep=1pt,parsep=0pt,partopsep=0pt]
    \item \textbf{Languages:} JavaScript, TypeScript, Java, C++
    \item \textbf{Backend:} Node.js, Express.js, REST APIs, Microservices, API Gateway, WebSockets, API Key Authentication, JWT,
    \item \textbf{Frontend:} React.js, HTML, CSS, Axios
    \item \textbf{Databases:} MongoDB, MySQL
    \item \textbf{Architecture \& Systems:} Service Integration, Third-Party API Access, In-Memory Hierarchy Mapping, Real-Time Chat Systems
    \item \textbf{Cloud, Tools \& Practices:} AWS (EC2, Lambda, S3), Firebase, Google Cloud (Compute Engine), Git, Docker, Nginx, Linux, Agile, Scrum, CI/CD
\end{itemize}

%--------------------EXPERIENCE--------------------
\section{Experience}
\item\resumetitle{Software Development Intern} \hfill Arcstream Technologies, Hyderabad \hfill Jan 2026 -- Present
\begin{itemize}[leftmargin=*,itemsep=0pt,topsep=1pt,parsep=0pt,partopsep=0pt]
    \item Worked on a production-oriented \textbf{microservice architecture}, contributing to backend services, service integrations, and \textbf{API Gateway}-based request routing.

    \item Built an independent \textbf{Connect Service} microservice and integrated a real-time chat application using \textbf{WebSockets} for low-latency user communication.

    \item Implemented in-memory hierarchical data construction using relationship mappings to build and traverse hierarchy-based user structures efficiently.

    \item Designed \textbf{API key-based authentication} for secure third-party access, and contributed across \textbf{backend, frontend,} and \textbf{Dynamic Rule Engine (DRE)} modules.
\end{itemize}

%--------------------PROJECTS--------------------
\section{Projects}
\item\resumetitle{Social-Media Platform} \hfill \href{https://github.com/LokeshGoswami2003/Social-Media}{GitHub} | \href{https://www.youtube.com/watch?v=0d_LtS0-k4Y}{YouTube} | \href{https://samvad.space/login}{Live} 
\begin{itemize}[leftmargin=*,itemsep=0pt,topsep=1pt,parsep=0pt,partopsep=0pt]
\item Built a full-stack social media platform using \textbf{ReactJS, Node.js, Express, MongoDB} with \textbf{25+ REST APIs} covering posts, users, likes, comments, and follow systems.

\item Implemented secure authentication and authorization using \textbf{JWT, bcrypt}, plus middleware for validation, error handling, and rate limiting.

\item Integrated \textbf{Cloudinary}, Axios interceptors, and optimized MongoDB schemas with indexing, improving media delivery and overall API performance.

\end{itemize}

\item\resumetitle{MunchMob Swiggy Clone} \hfill \href{https://github.com/LokeshGoswami2003/munchmob}{GitHub} | \href{https://drive.google.com/drive/u/0/folders/1d8irEFI7xwOwOOJ3aX6wI8lz4ggG3gpc?lfhs=2}{Snapshots}
\begin{itemize}[leftmargin=*,itemsep=0pt,topsep=1pt,parsep=0pt,partopsep=0pt]
    \item Developed a responsive \textbf{ReactJS} interface to fetch and display restaurant and menu data by reverse-engineering complex \textbf{Swiggy API JSON schemas}.

    \item Built a custom \textbf{Node.js/Express} proxy server to bypass \textbf{CORS restrictions} and enable stable cross-origin data fetching.

    \item Deployed the backend on a \textbf{Google Cloud VM} with \textbf{Nginx, HTTPS,} and a custom domain, and optimized parsing for large nested JSON responses.
\end{itemize}

\item\resumetitle{The Game Room – Real-Time Tic Tac Toe (Group Project)} \hfill \href{https://github.com/LokeshGoswami2003/TheGameRoom}{GitHub} | \href{https://www.youtube.com/watch?v=RACu1zRwCg4}{YouTube}
\begin{itemize}[leftmargin=*,itemsep=0pt,topsep=1pt,parsep=0pt,partopsep=0pt]
     \item Designed and implemented key \textbf{ReactJS} components for a real-time Tic Tac Toe interface, including the board, turn indicators, and result modals.

    \item Collaborated with teammates working on \textbf{Socket.io} and backend logic to ensure smooth UI-server synchronization and gameplay state updates.
\end{itemize}

%--------------------EDUCATION--------------------
\section{Education}
\vspace{0em} % This pulls the content up closer to the heading
\begin{itemize}[leftmargin=*,itemsep=0pt,topsep=1pt,parsep=0pt,partopsep=0pt]
    \item \textbf{B.Tech in Computer Science and Engineering} \hfill \hspace{-130pt} GLA University, Mathura  \hfill 2024
    \item \textbf{Senior Secondary (Class 12)} \hfill Saraswati Vidya Mandir, Kosi Kalan \hfill 2020
\end{itemize}


%--------------------ACHIEVEMENTS & CERTIFICATIONS--------------------
\section{Achievements \& Certifications}
\begin{itemize}[leftmargin=*,itemsep=0pt,topsep=1pt,parsep=0pt,partopsep=0pt]
\item Solved \textbf{200+ DSA problems} on LeetCode and completed DSA from \textbf{Coding Ninjas} 
\hfill \href{https://drive.google.com/file/d/12pCcUQ2nwlFkDHPjgyrbpWKoztH-vXxf/view}{Certificate}

\item Built multiple full-stack MERN projects and completed the \textbf{CodingShuttle Full-Stack Development Course}
\hfill \href{https://drive.google.com/file/d/15MSY8JEBfFA9dDpaCmtxIQMNNrNmUc1J/view}{Certificate}

\end{itemize}

\end{document}
