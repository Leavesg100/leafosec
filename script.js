// INTERACTIVE DOM SELECTION HANDLES
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const themeToggle = document.getElementById('theme-toggle');
const textTarget = document.getElementById('text-target');

// TERMINAL STATE ENGINE VARIABLE HOOKS
let gameActive = false;
let hackActive = false;
let hackStage = 0;
let hackFailedAttempts = 0;
let ctfActive = false; // Tracks if a CTF sub-challenge is running
let currentCtfLevel = 0; // Tracks which CTF level is active
let systemLocked = false;
const targetSecretPassphrase = "admin";

// COMMAND HISTORY STRINGS POINTERS
let commandHistoryList = [];
let historyPointerLocation = -1;
let currentDirectory = '/home/guest';

const fileSystem = {
    '/home/guest': {
        'rogue_ap.txt': { size: 984, mtime: 'Jul 01 13:14', mode: '-rw-r--r--', description: 'Rogue AP analysis log' },
        'spycam.txt': { size: 742, mtime: 'Jul 01 13:20', mode: '-rw-r--r--', description: 'Covert camera priority notes' },
        'wireshark.txt': { size: 1244, mtime: 'Jul 01 13:08', mode: '-rw-r--r--', description: 'Packet capture investigation summary' },
        'README.md': { size: 324, mtime: 'Jul 01 12:59', mode: '-rw-r--r--', description: 'Sandbox usage readme' },
        'notes.txt': { size: 218, mtime: 'Jul 01 12:58', mode: '-rw-r--r--', description: 'Operational notes' },
        'ctf_flag.txt': { size: 44, mtime: 'Jul 01 13:02', mode: '-rw-r--r--', description: 'CTF completion flag' },
        'secret': { size: 0, mtime: 'Jul 01 13:30', mode: '-rw-r--r--', description: 'Hidden secret asset' }
    },
    '/etc': {
        'motd': { size: 78, mtime: 'Jul 01 00:00', mode: '-rw-r--r--', description: 'Message of the day' },
        'hosts': { size: 152, mtime: 'Jul 01 00:00', mode: '-rw-r--r--', description: 'Local hosts file' }
    },
    '/var/log': {
        'auth.log': { size: 1620, mtime: 'Jul 01 12:56', mode: '-rw-r--r--', description: 'Authentication audit log' },
        'syslog': { size: 1888, mtime: 'Jul 01 12:59', mode: '-rw-r--r--', description: 'System event log' }
    }
};

const validSystemCommands = [
    'help', 'scan portfolio', 'dashboard', 'reports', 'report list', 'report rf', 'report rogue',
    'report cctv', 'report web', 'report pcap', 'tools', 'contact', 'open terminal', 'open about',
    'open tools', 'open reports', 'open gallery', 'open wardriving', 'open videos', 'open reviews', 'open windows report', 'pwd', 'cd /projects',
    'cd /videos', 'cd /wardriving', 'ls', 'ls -la', 'cat README.md', 'cat notes.txt',
    'cat rogue_ap.txt', 'cat spycam.txt', 'cat wireshark.txt', 'cat /home/guest/ctf_flag.txt',
    'ifconfig', 'ps aux', 'netstat -tulpn', 'nmap -sV 10.0.0.5', 'sudo -l', 'sudo apt update',
    'history', 'history -c', 'serial', 'ctf', 'hack', 'matrix', 'clear', 'locate *.txt',
    'whoami', 'about', 'skills', 'uname -a'
];

const reportBriefs = {
    rf: {
        kicker: 'RF Analysis',
        title: 'Sub-GHz Protocol Reverse Engineering',
        summary: 'Captured sub-GHz packets were compared in URH to separate synchronisation behavior, dynamic payload regions, and likely rolling-code characteristics.',
        evidence: ['URH capture screenshot', 'RF key fob audio conversion', 'Observed 430 MHz and 890 MHz signal notes'],
        skills: ['Signal capture workflow', 'Packet comparison', 'Protocol classification', 'Evidence documentation'],
        body: ['The analysis focuses on observable structure rather than bypassing protected systems. Multiple captures showed broad bit-level variation, which points toward a dynamic or rolling-code design.', 'The useful portfolio takeaway is the method: capture, calibrate samples per symbol, compare repeated transmissions, document limitations, and avoid overstating cryptographic conclusions.']
    },
    'rogue-ap': {
        kicker: 'Field Wireless',
        title: 'Anomalous Rogue AP Network',
        summary: 'Public-area wireless reconnaissance identified an unusual access point with captive-portal behavior and evasive availability patterns.',
        evidence: ['Captive portal interaction notes', 'M5Stack and LilyGO field sweep', 'Deauthentication and dormancy observations'],
        skills: ['Wireless reconnaissance', 'Risk triage', 'Client isolation checks', 'Responsible scoping'],
        body: ['The strongest part of this report is the decision boundary: the investigation describes indicators, limitations, and why further action was paused.', 'That makes the writeup more credible because it shows restraint and repeatable observation rather than dramatic claims.']
    },
    cctv: {
        kicker: 'Physical Recon',
        title: 'Rogue Wireless Surveillance Asset Profiling',
        summary: 'A hidden or low-duty wireless signature was documented near a public area and profiled against common micro-camera behavior.',
        evidence: ['Hidden ad-hoc network scan notes', '2.4 GHz broadcast behavior', 'Hardware lock instability notes'],
        skills: ['Physical reconnaissance', 'Wireless signature profiling', 'Threat hypothesis building', 'Evidence-led reporting'],
        body: ['The report frames the device as a suspected surveillance asset based on behavior, not certainty. That distinction helps keep the work professional.', 'A future improvement would be adding timestamps, RSSI trends, and a small map-free proximity log.']
    },
    bwapp: {
        kicker: 'Web Lab',
        title: 'bWAPP Vulnerability Lab',
        summary: 'Controlled web application testing against intentionally vulnerable local environments.',
        evidence: ['Local sandbox environment', 'Session and threshold observations', 'Authentication behavior notes'],
        skills: ['Web application testing', 'OWASP reasoning', 'Lab containment', 'Finding summaries'],
        body: ['This is the place to show clean methodology: scope, setup, test case, result, fix recommendation.', 'Adding screenshots and remediation notes would turn it from a demo into a stronger professional report.']
    },
    pcap: {
        kicker: 'Forensics',
        title: 'PCAP Phase 1 & 2 Network Analysis',
        summary: 'Network captures were reviewed to isolate suspicious payload strings and outbound communication patterns.',
        evidence: ['PCAP string filtering', 'TCP payload notes', 'External listener hypothesis'],
        skills: ['Wireshark filtering', 'Traffic triage', 'C2 pattern recognition', 'Forensic summary writing'],
        body: ['This report benefits from being concise. The next major upgrade would be adding exact filters used, packet numbers, and a short timeline.', 'Those details make it easier for a reviewer to reproduce the reasoning.']
    },
    pcap2: {
        kicker: 'Wireless Recon',
        title: 'Public Transit Hub Wireless Environment Reconnaissance',
        summary: 'Raw wireless packet capture (4,872 packets) analyzed in Wireshark, identifying enterprise-grade infrastructure, network segmentation, and anomalous probe requests.',
        evidence: ['Wireshark capture screenshot', '4,872 packet beacon/probe frame analysis', 'Enterprise 802.1X network identification', 'Anomalous null-byte SSID probe detection'],
        skills: ['Wireshark display filtering', 'Wireless beacon/probe frame analysis', 'Infrastructure vendor profiling', 'Network segmentation mapping', 'Anomaly detection'],
        body: ['The capture was conducted at a public transit hub using a Cardputer with EvilM5 firmware. The environment revealed a managed multi-tenant wireless deployment with enterprise-grade security on the 802.1x network.', 'Key finding: A probe request from a locally administered MAC broadcasting a null-byte SSID was identified, potentially indicating SDR activity or misconfigured hardware.', 'Applied Wireshark filters included wlan.fc.type_subtype == 0x08 for beacons, wlan.fc.type_subtype == 0x04 for probe requests, and wlan.rsn.akm.type == 1 for 802.1X traffic.']
    }
};

// 1. AUTOMATIC CONTINUOUS TYPING ANIMATION (HEADER)
const phrases = ["$ whoami", "$ execute portfolio.sh", "$ pentester --active"];
let phraseIndex = 0;
let characterIndex = 0;
let isDeleting = false;

function typeEffect() {
    if (!textTarget) return;
    const currentPhrase = phrases[phraseIndex];
    if (isDeleting) {
        textTarget.textContent = currentPhrase.substring(0, characterIndex - 1);
        characterIndex--;
    } else {
        textTarget.textContent = currentPhrase.substring(0, characterIndex + 1);
        characterIndex++;
    }

    let typeSpeed = isDeleting ? 50 : 100;
    if (!isDeleting && characterIndex === currentPhrase.length) {
        typeSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && characterIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 500;
    }
    setTimeout(typeEffect, typeSpeed);
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"]/g, (match) => {
        switch (match) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            default: return match;
        }
    });
}

let terminalClickSound = null;
try {
    terminalClickSound = new Audio('terminal-click.mp3');
    terminalClickSound.volume = 0.06;
} catch (e) {
    terminalClickSound = null;
}

function playTerminalClick() {
    if (!terminalClickSound) return;
    terminalClickSound.currentTime = 0;
    terminalClickSound.play().catch(() => { });
}

function saveCommandHistory() {
    try {
        localStorage.setItem('terminalHistory', JSON.stringify(commandHistoryList.slice(-50)));
    } catch (e) {
        // ignore storage errors
    }
}

function loadCommandHistory() {
    try {
        const data = localStorage.getItem('terminalHistory');
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                commandHistoryList = parsed.slice(-50);
            }
        }
    } catch (e) {
        // ignore invalid JSON
    }
}

function typeTerminalLine(text, className = '', callback) {
    const safeText = escapeHtml(text);
    const div = document.createElement('div');
    if (className) div.className = className;
    terminalOutput.appendChild(div);

    let idx = 0;
    function typeNextChar() {
        if (idx < safeText.length) {
            div.textContent += safeText[idx++];
            document.getElementById('terminal').scrollTop = document.getElementById('terminal').scrollHeight;
            setTimeout(typeNextChar, 10 + Math.random() * 20);
        } else if (callback) {
            callback(div);
        }
    }
    typeNextChar();
    return div;
}

function logOutput(text, className = '') {
    if (typeof text !== 'string') text = String(text);
    return typeTerminalLine(text, className);
}

function navigateShellPath(path) {
    const normalized = path.trim();
    const targets = {
        '/dashboard': '#mission-dashboard',
        '/terminal': '#interactive-terminal',
        '/about': '#about',
        '/tools': '#tools-arsenal',
        '/reports': '#writeups',
        '/gallery': '#image-gallery',
        '/contact': '#contact',
        '/projects': '#projects-view',
        '/videos': '#ctf-gallery',
        '/wardriving': '#wardriving'
    };
    const selector = targets[normalized];
    if (!selector) return false;
    const section = document.querySelector(selector);
    if (!section) return false;
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
    logOutput(`Navigated to ${normalized}`, 'output-success');
    return true;
}

function initTelemetry() {
    const cpu = document.getElementById('telemetry-cpu');
    const net = document.getElementById('telemetry-net');
    const beacon = document.getElementById('telemetry-beacon');
    if (!cpu || !net || !beacon) return;

    function updateTelemetry() {
        cpu.textContent = `${(Math.random() * 18 + 8).toFixed(0)} %`;
        net.textContent = `${(Math.random() * 3 + 0.2).toFixed(2)} Mbps`;
        beacon.textContent = ['active', 'idle', 'scan'].sort(() => 0.5 - Math.random())[0];
    }
    updateTelemetry();
    setInterval(updateTelemetry, 4000);
}

function scrollToSection(selector, label) {
    const section = document.querySelector(selector);
    if (!section) {
        logOutput(`Navigation target unavailable: ${label}`, 'output-error');
        return false;
    }
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    logOutput(`Opened ${label}.`, 'output-success');
    return true;
}

function logPortfolioScan() {
    logOutput('[+] Portfolio scan complete:', 'output-success');
    logOutput('  dashboard     active operator summary and evidence routes', 'output-info');
    logOutput('  terminal      shell navigation, CTF, exploit simulation', 'output-info');
    logOutput('  tools         web, network, RF, and field hardware profile', 'output-info');
    logOutput('  reports       field ops, RF analysis, PCAP, web lab briefs', 'output-info');
    logOutput('  gallery       equipment images and RF evidence assets', 'output-info');
    logOutput('  contact       email and profile links', 'output-info');
}

function logReportList() {
    logOutput('Available report briefs:', 'output-info');
    logOutput('  report rf      - Sub-GHz protocol reverse engineering', 'text-main');
    logOutput('  report rogue   - Rogue AP public-area field operation', 'text-main');
    logOutput('  report cctv    - Wireless surveillance asset profiling', 'text-main');
    logOutput('  report web     - bWAPP vulnerability lab', 'text-main');
    logOutput('  report pcap    - Wireshark / PCAP analysis', 'text-main');
}

function openReportModal(reportKey) {
    const report = reportBriefs[reportKey];
    const modal = document.getElementById('report-modal');
    if (!report || !modal) return false;

    document.getElementById('report-modal-kicker').textContent = report.kicker;
    document.getElementById('report-modal-title').textContent = report.title;
    document.getElementById('report-modal-summary').textContent = report.summary;

    const evidence = document.getElementById('report-modal-evidence');
    const skills = document.getElementById('report-modal-skills');
    const body = document.getElementById('report-modal-body');

    evidence.innerHTML = report.evidence.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    skills.innerHTML = report.skills.map(item => `<li>${escapeHtml(item)}</li>`).join('');
    body.innerHTML = report.body.map(item => `<p>${escapeHtml(item)}</p>`).join('');

    modal.setAttribute('aria-hidden', 'false');
    return true;
}

function closeReportModal() {
    const modal = document.getElementById('report-modal');
    if (modal) modal.setAttribute('aria-hidden', 'true');
}

// 2. DYNAMIC REALISTIC LINUX KERNEL INITIALIZATION LOG RUNNER
function executeKernelBootSequence() {
    systemLocked = true;
    terminalInput.disabled = true;
    terminalOutput.innerHTML = '';

    const bootLogs = [
        "[   0.000000] Booting Linux kernel on physical hardware...",
        "[   0.004120] CPU0: Intel(R) Core(TM) Architecture initialized",
        "[   0.021045] ACPI: Core Subsystem System Control initialized",
        "[   0.142510] Memory: 16384K/1048576K available sandbox RAM memory",
        "[   0.381240] USB: Wireless RF core modules interface attached (ESP32-C3)",
        "[   0.620105] Network: Initializing automated multi-hop proxy chains...",
        "[   0.984120] Security: Hardening operational sandbox runtime environment...",
        "[   1.240510] Network: Proxy link established successfully -> 127.0.0.1:9050",
        "[   1.500000] Session authorized. Welcome back, agent."
    ];

    let currentLogIndex = 0;
    function printNextBootLog() {
        if (currentLogIndex < bootLogs.length) {
            logOutput(bootLogs[currentLogIndex], currentLogIndex > 6 ? 'output-success' : 'text-main');
            currentLogIndex++;
            setTimeout(printNextBootLog, Math.random() * 150 + 50);
        } else {
            systemLocked = false;
            terminalInput.disabled = false;
            logOutput("----------------------------------------------------------------", 'output-info');
            logOutput("Type 'help' to review directory flags or 'ctf' to start the challenges.", 'output-info');
            terminalInput.focus();
        }
    }
    printNextBootLog();
}

function normalizePath(rawPath) {
    if (!rawPath || rawPath.trim() === '.') return currentDirectory;
    const cleaned = rawPath.trim();
    if (cleaned === '..') {
        if (currentDirectory === '/' || currentDirectory === '') return '/';
        const parts = currentDirectory.split('/').filter(Boolean);
        parts.pop();
        return '/' + parts.join('/');
    }
    if (cleaned.startsWith('/')) return cleaned;
    const base = currentDirectory.endsWith('/') ? currentDirectory.slice(0, -1) : currentDirectory;
    return base === '/' ? `/${cleaned}` : `${base}/${cleaned}`;
}

function executeCdCommand(path) {
    const target = normalizePath(path || '/home/guest');
    if (fileSystem[target]) {
        currentDirectory = target;
        logOutput(`Changed directory to ${currentDirectory}`, 'output-info');
        return true;
    }
    return false;
}

function listDirectory(targetPath = '') {
    const path = normalizePath(targetPath);
    if (!fileSystem[path]) {
        logOutput(`ls: cannot access '${targetPath}': No such file or directory`, 'output-error');
        return;
    }
    const entries = fileSystem[path];
    logOutput(Object.keys(entries).join('   '), 'text-main');
}

function getAllTextFiles() {
    return Object.values(fileSystem).flatMap(dir => Object.keys(dir)).filter(name => name.endsWith('.txt'));
}

function logIfconfig() {
    logOutput('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500', 'text-main');
    logOutput('        inet 10.0.0.5  netmask 255.255.255.0  broadcast 10.0.0.255', 'text-main');
    logOutput('        ether 02:42:ac:11:00:02  txqueuelen 1000  (Ethernet)', 'text-main');
    logOutput('lo:   flags=73<UP,LOOPBACK,RUNNING>  mtu 65536', 'text-main');
    logOutput('        inet 127.0.0.1  netmask 255.0.0.0', 'text-main');
}

function logPsAux() {
    logOutput('USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND', 'text-main');
    logOutput('root         1  0.0  0.1 169168  6200 ?        Ss   13:50   0:01 /sbin/init', 'text-main');
    logOutput('guest     2321  0.1  0.9 257400 12520 pts/0    Ss   13:52   0:02 bash', 'text-main');
    logOutput('guest     2452  0.0  0.4 142312  5824 pts/0    R+   13:53   0:00 ps aux', 'text-main');
    logOutput('guest     2501  0.0  0.1  112536  4092 pts/0    S+   13:53   0:00 script.js', 'text-main');
}

function logNetstat() {
    logOutput('Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name', 'text-main');
    logOutput('tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      1024/sshd', 'text-main');
    logOutput('tcp        0      0 0 10.0.0.5:80            0.0.0.0:*               LISTEN      2158/nginx', 'text-main');
    logOutput('tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN      1847/mysqld', 'text-main');
    logOutput('udp        0      0 0.0.0.0:53              0.0.0.0:*                           1234/dnsmasq', 'text-main');
}

function logNmapScan() {
    logOutput('Starting Nmap 7.80 ( https://nmap.org ) at 13:54', 'text-main');
    logOutput('Nmap scan report for 10.0.0.5', 'text-main');
    logOutput('Host is up (0.0012s latency).', 'text-main');
    logOutput('Not shown: 997 closed ports', 'text-main');
    logOutput('PORT    STATE SERVICE VERSION', 'text-main');
    logOutput('22/tcp  open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5', 'text-main');
    logOutput('80/tcp  open  http    nginx 1.18.0 (Ubuntu)', 'text-main');
    logOutput('3306/tcp open  mysql   MySQL 5.7.33-0ubuntu0.18.04.1', 'text-main');
}

function logSudoList() {
    logOutput('Matching Defaults entries for guest on this host:', 'text-main');
    logOutput('    env_reset, mail_badpass, secure_path=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', 'text-main');
    logOutput('User guest may run the following commands on this host:', 'text-main');
    logOutput('    (ALL) NOPASSWD: /usr/bin/env', 'text-main');
}

function logAptUpdate() {
    logOutput('Get:1 http://archive.ubuntu.com/ubuntu focal InRelease [242 kB]', 'output-info');
    logOutput('Get:2 http://archive.ubuntu.com/ubuntu focal-updates InRelease [109 kB]', 'output-info');
    logOutput('Get:3 http://archive.ubuntu.com/ubuntu focal-security InRelease [109 kB]', 'output-info');
    logOutput('Reading package lists... Done', 'output-success');
    logOutput('Building dependency tree       ', 'output-success');
    logOutput('Reading state information... Done', 'output-success');
    logOutput('All packages are up to date.', 'output-success');
}

const ctfLevels = {
    1: {
        title: 'Cryptography Defenses',
        prompt: [
            '[+] CTF LEVEL 1: Cryptography Defenses',
            'Our intelligence intercepted an obfuscated base64 payload transmission string:',
            '    "U3BlY3RydW1fU2VjdXJlXzIwMjY="',
            'Decode the base64 string to find the plaintext access passphrase key token:'
        ],
        answer: ['spectrum_secure_2026'],
        hint: 'The payload is base64 encoded. Decode it to recover the mission passphrase.'
    },
    2: {
        title: 'Log Forensic Incident Analysis',
        prompt: [
            '[+] CTF LEVEL 2: Log Forensic Incident Analysis',
            'Review this snippet of an internal database firewall intrusion log dump:',
            '  [10:14:02] 192.168.1.105 - GET /index.php HTTP/1.1 - 200 OK',
            '  [10:14:15] 10.0.0.42     - POST /login.php HTTP/1.1 - 401 Unauthorized',
            "  [10:15:22] 192.168.88.7  - GET /products.php?id=1'%20OR%20'1'='1 HTTP/1.1 - 500 Internal Error",
            'Identify the source IP address executing the dynamic SQL Injection (SQLi) vector attack query:'
        ],
        answer: ['192.168.88.7'],
        hint: 'The malicious query contains a classic SQLi payload. Find the source IP attached to that GET request.'
    },
    3: {
        title: 'Privilege Escalation Bounds',
        prompt: [
            '[+] CTF LEVEL 3: Privilege Escalation Bounds',
            'You have achieved local low-privilege user access. Typing "sudo -l" returns the following:',
            '  User guest may run the following commands on host-node:',
            '     (ALL) NOPASSWD: /usr/bin/env',
            'What parameter flag command argument string should you chain to "/usr/bin/env" to spawn an unrestricted root shell?',
            'Hint: standard UNIX system executable terminal prompt shorthand name'
        ],
        answer: ['/bin/sh', '/bin/bash', 'sh', 'bash'],
        hint: 'The shell binary is usually found under /bin. Use env to invoke it.'
    },
    4: {
        title: 'Hidden Flag Retrieval',
        prompt: [
            '[+] CTF LEVEL 4: Hidden Flag Retrieval',
            'You have root-like shell access inside the sandbox. A final proof-of-access file is hidden in your home directory.',
            'Locate and read the file to capture the final flag. Example path: /home/guest/ctf_flag.txt'
        ],
        answer: ['cat /home/guest/ctf_flag.txt', 'cat /home/guest/ctf_flag.txt '],
        hint: 'Use a single cat command to read the file stored in /home/guest.'
    }
};

document.addEventListener("DOMContentLoaded", () => {
    typeEffect();
    executeKernelBootSequence();
    loadCommandHistory();
    initTelemetry();
});

// 10. FEEDBACK FORM: word-count validation (200 words max) and Netlify-ready submission
function countWords(text) {
    if (!text) return 0;
    // split on whitespace and filter empty entries
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function setupFeedbackForm() {
    const form = document.getElementById('feedback-form');
    if (!form) return;
    const comment = document.getElementById('feedback-comment');
    const counter = document.getElementById('comment-counter');
    const submit = document.getElementById('feedback-submit');
    const WORD_LIMIT = 200;

    function updateCounter() {
        const words = countWords(comment.value);
        counter.textContent = `${words} / ${WORD_LIMIT} words`;
        if (words > WORD_LIMIT) {
            counter.style.color = '#da3633';
            submit.disabled = true;
            return false;
        } else {
            counter.style.color = '#8b949e';
            submit.disabled = false;
            return true;
        }
    }

    // live update
    comment.addEventListener('input', updateCounter);
    // initial
    updateCounter();

    form.addEventListener('submit', async function (e) {
        const ok = updateCounter();
        if (!ok) {
            e.preventDefault();
            alert('Your comment exceeds the 200-word limit. Please shorten it.');
            return;
        }

        // Shared reviews via Netlify Function
        const name = form.querySelector('[name="name"]').value.trim();
        const rating = form.querySelector('[name="rating"]').value;
        const comment = form.querySelector('[name="comment"]').value.trim();

        const payload = {
            name: name || 'Anonymous',
            rating: parseInt(rating, 10),
            comment,
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        };

        try {
            e.preventDefault();

            await fetch('/.netlify/functions/reviews', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // After successful save, reload into a clean state.
            form.reset();
            updateCounter();

            // Keep user on the same page.
            window.location.href = 'reviews.html';
        } catch (err) {
            // Fallback: allow normal submit (Netlify forms) if function fails.
            // Also don't block users from submitting.
        }
    });
}

// Attach form setup and theme initialization after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setupFeedbackForm();
    initThemeSwitcher();
});
// 3. THEME SCHEME SWITCH ROUTINE
function applyThemeMode(mode) {
    document.body.classList.remove('dark-theme', 'matrix-theme');
    if (mode === 'matrix') {
        document.body.classList.add('matrix-theme');
        if (themeToggle) themeToggle.textContent = 'GitHub Mode';
    } else {
        document.body.classList.add('dark-theme');
        if (themeToggle) themeToggle.textContent = 'Matrix Mode';
    }
    try { localStorage.setItem('preferredTheme', mode); } catch (e) { /* ignore */ }
}

function initThemeSwitcher() {
    const pref = localStorage.getItem('preferredTheme') || 'dark';
    applyThemeMode(pref);
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.body.classList.contains('matrix-theme') ? 'matrix' : 'dark';
            applyThemeMode(current === 'dark' ? 'matrix' : 'dark');
        });
    }
}

// 4. COLLAPSIBLE ACCORDION PANELS
function toggleReport(id) {
    const report = document.getElementById(id);
    if (!report) return false;
    const isOpen = report.classList.toggle('open');
    report.style.display = isOpen ? 'block' : 'none';
    return true;
}

// 11. Layout mode switcher (desktop/tablet/mobile) - persisted in localStorage
function applyLayoutMode(mode) {
    document.body.classList.remove('layout-desktop', 'layout-tablet', 'layout-mobile');
    const cls = `layout-${mode}`;
    document.body.classList.add(cls);
    // update active button state
    const modes = ['desktop', 'tablet', 'mobile'];
    modes.forEach(m => {
        const btn = document.getElementById(`layout-${m}-btn`);
        if (btn) btn.classList.toggle('active', m === mode);
    });
    try { localStorage.setItem('preferredLayout', mode); } catch (e) { /* ignore */ }
}

function initLayoutSwitcher() {
    const pref = (localStorage.getItem('preferredLayout') || 'desktop');
    applyLayoutMode(pref);
    const modes = ['desktop', 'tablet', 'mobile'];
    modes.forEach(mode => {
        const btn = document.getElementById(`layout-${mode}-btn`);
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyLayoutMode(mode);
            closeLayoutDropdown();
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initLayoutSwitcher();
    document.querySelectorAll('.terminal-command-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const command = btn.getAttribute('data-command');
            if (!command || systemLocked) return;
            terminalInput.value = command;
            terminalInput.focus();
            logOutput(`guest@pentest:~$ ${command}`);
            processCommand(command.toLowerCase());
            terminalInput.value = '';
            commandHistoryList.push(command);
            historyPointerLocation = -1;
            saveCommandHistory();
        });
    });

    document.querySelectorAll('.report-modal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const reportKey = btn.getAttribute('data-report');
            openReportModal(reportKey);
        });
    });

    const reportModal = document.getElementById('report-modal');
    const reportModalClose = document.querySelector('.report-modal-close');
    if (reportModalClose) reportModalClose.addEventListener('click', closeReportModal);
    if (reportModal) {
        reportModal.addEventListener('click', (e) => {
            if (e.target === reportModal) closeReportModal();
        });
    }

    const hardwareLinkBtn = document.getElementById('hardware-link-btn');
    if (hardwareLinkBtn) {
        hardwareLinkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            logOutput('[*] Initiating hardware handshake...', 'output-info');
            setTimeout(() => {
                logOutput('Searching for ESP32 devices on serial port...', 'output-info');
                if (navigator.serial) {
                    logOutput('Web Serial API available. No ESP32 devices detected.', 'output-info');
                } else {
                    logOutput('Web Serial API unavailable in this browser. No ESP32 devices detected.', 'output-error');
                }
            }, 900);
        });
    }
});

// Wire any report-toggle buttons to the toggleReport function and stop propagation
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.report-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const target = btn.getAttribute('data-target') || (btn.getAttribute('onclick') || '').match(/'([^']+)'/)?.[1];
            if (target) toggleReport(target);
        });
    });
});

// Hamburger dropdown toggle behavior
const layoutToggleBtn = document.getElementById('layout-toggle-btn');
const layoutDropdown = document.getElementById('layout-dropdown');

function closeLayoutDropdown() {
    if (layoutDropdown) layoutDropdown.setAttribute('aria-hidden', 'true');
    if (layoutToggleBtn) layoutToggleBtn.setAttribute('aria-expanded', 'false');
}

if (layoutToggleBtn) {
    layoutToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = layoutToggleBtn.getAttribute('aria-expanded') === 'true';
        layoutToggleBtn.setAttribute('aria-expanded', String(!expanded));
        if (layoutDropdown) layoutDropdown.setAttribute('aria-hidden', String(expanded));
    });
}

// close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const target = e.target;
    if (!layoutDropdown || !layoutToggleBtn) return;
    if (layoutDropdown.contains(target) || layoutToggleBtn.contains(target)) return;
    closeLayoutDropdown();
});

// 5. CATEGORY PORTFOLIO CARD FILTERS
function filterCategory(category, event) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    const cards = document.querySelectorAll('.writeup-card');
    cards.forEach(card => {
        if (category === 'all' || card.classList.contains(category)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

// 6. TERMINAL SHIELD KEY CAPTURE SHORTCUT LISTENERS
document.getElementById('terminal').addEventListener('click', () => {
    if (!systemLocked) terminalInput.focus();
});

terminalInput.addEventListener('keydown', function (event) {
    if (event.key === 'Tab') {
        event.preventDefault();
        const currentTypedString = this.value.trim().toLowerCase();
        if (currentTypedString === '') return;

        const matches = validSystemCommands.filter(cmd => cmd.startsWith(currentTypedString));
        if (matches.length === 1) {
            this.value = matches[0];
        } else if (matches.length > 1) {
            logOutput(`\nPossible completions: ${matches.join(', ')}`, 'output-info');
        }
    }

    if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (commandHistoryList.length > 0 && historyPointerLocation < commandHistoryList.length - 1) {
            historyPointerLocation++;
            this.value = commandHistoryList[commandHistoryList.length - 1 - historyPointerLocation];
        }
    }

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (historyPointerLocation > 0) {
            historyPointerLocation--;
            this.value = commandHistoryList[commandHistoryList.length - 1 - historyPointerLocation];
        } else if (historyPointerLocation === 0) {
            historyPointerLocation = -1;
            this.value = '';
        }
    }

    if (event.key === 'Enter') {
        const inputRaw = this.value.trim();

        if (systemLocked) {
            this.value = '';
            return;
        }

        playTerminalClick();
        logOutput(`guest@pentest:~$ ${inputRaw}`);

        if (inputRaw !== '') {
            commandHistoryList.push(inputRaw);
            historyPointerLocation = -1;
            saveCommandHistory();
        }

        if (gameActive) {
            handleGameInput(inputRaw);
        } else if (ctfActive) {
            handleCtfInput(inputRaw);
        } else {
            processCommand(inputRaw.toLowerCase());
        }

        this.value = '';
        document.getElementById('terminal').scrollTop = document.getElementById('terminal').scrollHeight;
    }
});

function processCommand(cmd) {
    if (cmd === '') return;

    if (cmd.startsWith('echo ')) {
        logOutput(cmd.substring(5), 'text-main');
        return;
    }

    if (cmd.startsWith('cat ')) {
        const fileTarget = cmd.substring(4).trim();
        handleCatCommands(fileTarget);
        return;
    }

    if (cmd.startsWith('ping ')) {
        const targetHost = cmd.substring(5).trim();
        executePingSequence(targetHost);
        return;
    }

    if (cmd.startsWith('cd')) {
        const path = cmd.substring(2).trim();
        if (!executeCdCommand(path || '/home/guest')) {
            if (!navigateShellPath(path)) {
                logOutput(`bash: cd: ${path}: No such file or directory`, 'output-error');
            }
        }
        return;
    }

    switch (cmd) {
        case 'help':
            logOutput('Standard Shell Utilities:', 'output-info');
            logOutput('  help                  - Show available commands', 'output-info');
            logOutput('  scan portfolio        - Summarize the main portfolio routes', 'output-info');
            logOutput('  dashboard             - Jump to mission dashboard', 'output-info');
            logOutput('  tools                 - Jump to toolkit section', 'output-info');
            logOutput('  reports               - List operation report briefs', 'output-info');
            logOutput('  report [name]         - Open rf, rogue, cctv, web, or pcap brief', 'output-info');
            logOutput('  contact               - Jump to contact links', 'output-info');
            logOutput('  open [section]        - Open terminal/about/tools/reports/gallery/wardriving/videos/reviews', 'output-info');
            logOutput('  pwd                   - Print working directory', 'output-info');
            logOutput('  cd [dir]              - Change directory or shell navigate (/projects, /videos, /wardriving)', 'output-info');
            logOutput('  ls                    - List files in current directory', 'output-info');
            logOutput('  ls -la                - List files with permissions', 'output-info');
            logOutput('  cat [file]            - Read file contents', 'output-info');
            logOutput('  whoami                - Display current user', 'output-info');
            logOutput('  about                 - Read portfolio bio', 'output-info');
            logOutput('  skills                - List technical skills', 'output-info');
            logOutput('  uname -a              - Display system info', 'output-info');
            logOutput('  ifconfig              - Show network interface details', 'output-info');
            logOutput('  ps aux                - List running processes', 'output-info');
            logOutput('  netstat -tulpn        - List listening network sockets', 'output-info');
            logOutput('  nmap -sV 10.0.0.5     - Scan common open ports on target host', 'output-info');
            logOutput('  sudo -l               - Check allowed sudo commands', 'output-info');
            logOutput('  sudo apt update       - Simulate package update check', 'output-info');
            logOutput('  history               - Print session command log', 'output-info');
            logOutput('  history -c            - Clear session history', 'output-info');
            logOutput('  serial                - Simulate Web Serial hardware link session', 'output-info');
            logOutput('  ctf                   - Launch the interactive Mini-CTF challenges terminal', 'output-info');
            logOutput('  hack                  - Launch automated network exploit game', 'output-info');
            logOutput('  matrix                - Toggle Matrix theme effect', 'output-info');
            logOutput('  clear                 - Clear terminal output', 'output-info');
            logOutput('  locate *.txt          - Find all .txt files', 'output-info');
            logOutput('Navigation Shortcuts:', 'output-info');
            logOutput('  cd /projects          - Jump to Projects section', 'output-info');
            logOutput('  cd /videos            - Jump to Video Gallery', 'output-info');
            logOutput('  cd /wardriving        - Jump to Wardriving section', 'output-info');
            logOutput('Site Pages:', 'output-info');
            logOutput('  open videos           - Open videos page', 'output-info');
            logOutput('  open reviews          - Open reviews page', 'output-info');
            logOutput('  open windows report   - Open My Labs page', 'output-info');
            break;

        case 'scan portfolio':
            logPortfolioScan();
            break;

        case 'dashboard':
            scrollToSection('#mission-dashboard', 'mission dashboard');
            break;

        case 'tools':
            scrollToSection('#tools-arsenal', 'toolkit');
            break;

        case 'reports':
        case 'report list':
            logReportList();
            scrollToSection('#writeups', 'operation reports');
            break;

        case 'report rf':
            openReportModal('rf');
            logOutput('Opened RF briefing modal.', 'output-success');
            break;

        case 'report rogue':
            openReportModal('rogue-ap');
            logOutput('Opened rogue AP briefing modal.', 'output-success');
            break;

        case 'report cctv':
            openReportModal('cctv');
            logOutput('Opened CCTV briefing modal.', 'output-success');
            break;

        case 'report web':
            openReportModal('bwapp');
            logOutput('Opened web lab briefing modal.', 'output-success');
            break;

        case 'report pcap':
            openReportModal('pcap');
            logOutput('Opened PCAP briefing modal.', 'output-success');
            break;

        case 'contact':
            scrollToSection('#contact', 'contact links');
            break;

        case 'open terminal':
            scrollToSection('#interactive-terminal', 'terminal');
            break;

        case 'open about':
            scrollToSection('#about', 'about section');
            break;

        case 'open tools':
            scrollToSection('#tools-arsenal', 'toolkit');
            break;

        case 'open reports':
            scrollToSection('#writeups', 'operation reports');
            break;

        case 'open gallery':
            scrollToSection('#image-gallery', 'equipment gallery');
            break;

        case 'open wardriving':
            scrollToSection('#wardriving', 'wardriving section');
            break;

        case 'open videos':
            window.location.href = 'videos.html';
            break;

        case 'open reviews':
            window.location.href = 'reviews.html';
            break;

        case 'open windows report':
            window.location.href = 'MyLabs.html';
            break;

        case 'pwd':
            logOutput(currentDirectory, 'text-main');
            break;

        case 'whoami':
            logOutput('------------------------------------------------', 'output-secret');
            logOutput('  USER: guest_operator_01                       ', 'output-success');
            logOutput('  CLEARANCE: Level 3 Physical & RF Auditing     ', 'output-success');
            logOutput('  STATUS: Active Penetration Tester             ', 'output-success');
            logOutput('  TARGET ZONE: Urban Public Transport Sector', 'output-info');
            logOutput('------------------------------------------------', 'output-secret');
            break;

        case 'about':
            logOutput('I am an ethical hacker specializing in application, network, RF, and on-site field assessments.', 'output-success');
            break;

        case 'skills':
            logOutput('Core Stack: Wireshark data forensics, SDR wave replays, RFID credential cloning, hardware debugging.', 'output-success');
            break;

        case 'uname -a':
            logOutput('Linux pentest-sandbox 6.1.0-cyber-core #1 SMP PREEMPT_DYNAMIC GNU/Linux x86_64 standalone', 'text-main');
            break;

        case 'history':
            if (commandHistoryList.length === 0) {
                logOutput('History buffer empty.', 'output-info');
            } else {
                commandHistoryList.forEach((historyCmd, idx) => {
                    logOutput(`  ${idx + 1}  ${historyCmd}`, 'text-main');
                });
            }
            break;

        case 'history -c':
            commandHistoryList = [];
            logOutput('History cleared.', 'output-info');
            break;

        case 'ls':
            listDirectory(currentDirectory);
            break;

        case 'ls -la':
        case 'ls -a':
            if (fileSystem[currentDirectory]) {
                const entries = Object.keys(fileSystem[currentDirectory]);
                logOutput('total ' + (entries.length * 4), 'output-info');
                entries.forEach(fileName => {
                    logOutput(`-rw-r--r--  1 guest staff   ${fileName.length * 16} Jun 14 13:00 ${fileName}`, 'text-main');
                });
            } else {
                logOutput(`ls: cannot access '${currentDirectory}': No such file or directory`, 'output-error');
            }
            break;

        case 'ifconfig':
            logIfconfig();
            break;

        case 'ps aux':
            logPsAux();
            break;

        case 'netstat -tulpn':
            logNetstat();
            break;

        case 'nmap -sV 10.0.0.5':
            logNmapScan();
            break;

        case 'sudo -l':
            logSudoList();
            break;

        case 'sudo apt update':
            logAptUpdate();
            break;

        case 'matrix':
            themeToggle.click();
            logOutput('Theme configuration manipulated via core console engine.', 'output-success');
            break;

        case 'ctf':
            startCtfGameEngine();
            break;

        case 'hack':
            runNetworkLoadingSequence();
            break;

        case 'clear':
            terminalOutput.innerHTML = '';
            break;

        case 'locate *.txt':
            logOutput(getAllTextFiles().join('   '), 'text-main');
            break;

        default:
            logOutput(`Unknown command configuration syntax: '${cmd}'. Type 'help' to review directory flags.`, 'output-error');
    }
}

function handleCatCommands(filename) {
    const fileTarget = filename.trim();
    switch (fileTarget) {
        case 'wireshark.txt':
        case '/home/guest/wireshark.txt':
            logOutput('[+] PCAP ANALYTICS LOG OUT:', 'output-success');
            logOutput('Anomalous POST strings tracking pinpointed active C2 listening channels inside streams.');
            break;
        case 'rogue_ap.txt':
        case '/home/guest/rogue_ap.txt':
            logOutput('[+] ROGUE ACCESS POINT ANALYSIS:', 'output-success');
            logOutput('Public transit area AP broadcasted a random SSID with no internet access. Blocked client devices within 3 minutes using targeted deauth frames.');
            break;
        case 'spycam.txt':
        case '/home/guest/spycam.txt':
            logOutput('[+] COVERT SURVEILLANCE REPORT:', 'output-success');
            logOutput('Isolated suspicious unmapped BSSID operating near a retail parking area. Signatures closely match an A9 hidden micro-camera module.');
            break;
        case 'README.md':
        case '/home/guest/README.md':
            logOutput('This sandbox simulates a Kali-style terminal environment. Run `help` for available commands.', 'text-main');
            break;
        case 'notes.txt':
        case '/home/guest/notes.txt':
            logOutput('Note: The CTF engine supports hint, status, and answer submission inside the ctf challenge.', 'text-main');
            break;
        case 'motd':
        case '/etc/motd':
            logOutput('Welcome to the Pentest Sandbox. Use the terminal commands to prove your exploit skills.', 'text-main');
            break;
        case 'secret':
            // Reveal the secret image in the image modal
            logOutput('[+] Revealing secret...', 'output-info');
            openImageModal('images/hacker.png', 'Secret: hacker.png');
            break;
        case '/home/guest/ctf_flag.txt':
        case 'ctf_flag.txt':
            logOutput('FLAG{KALI_TERMINAL_MASTER}', 'output-success');
            break;
        default:
            logOutput(`Error: file '${filename}' not found under current operations partition.`, 'output-error');
    }
}
// 7. MINI CTF GAME SYSTEM LOGIC
function startCtfGameEngine() {
    ctfActive = true;
    currentCtfLevel = 1;
    logOutput('====================================================', 'output-secret');
    logOutput('[!] INITIALISING OPERATIONS CTF LAB CHAMBER...', 'output-secret');
    logOutput('Type your answers directly into the prompt. Type "hint" for a clue, "status" for progress, or "exit" to quit.', 'output-info');
    logOutput('====================================================', 'output-secret');
    loadCtfLevelPrompt();
}

function loadCtfLevelPrompt() {
    const level = ctfLevels[currentCtfLevel];
    if (!level) {
        logOutput('[!] No further CTF levels available.', 'output-error');
        ctfActive = false;
        return;
    }
    logOutput(`\n[+] ${level.title}`, 'output-info');
    level.prompt.forEach(line => logOutput(line, 'text-main'));
    logOutput('Enter the answer now:', 'output-info');
}

function handleCtfInput(guess) {
    const input = guess.trim();
    const lowerGuess = input.toLowerCase();
    const level = ctfLevels[currentCtfLevel];

    if (lowerGuess === 'exit') {
        logOutput('[!] Aborting operational test sandbox.', 'output-error');
        ctfActive = false;
        currentCtfLevel = 0;
        return;
    }

    if (lowerGuess === 'hint') {
        logOutput(`Hint: ${level.hint}`, 'output-info');
        return;
    }

    if (lowerGuess === 'status') {
        logOutput(`CTF Level ${currentCtfLevel}: ${level.title}`, 'output-info');
        logOutput('Type an answer or use "hint" for help.', 'output-info');
        return;
    }

    if (lowerGuess === 'help') {
        logOutput('CTF commands: hint, status, exit', 'output-info');
        return;
    }

    const correct = level.answer.some(answer => answer.toLowerCase() === lowerGuess);
    if (correct) {
        if (currentCtfLevel === 4) {
            logOutput('[+] FINAL FLAG CAPTURED: FLAG{KALI_TERMINAL_MASTER}', 'output-success');
            logOutput('[+] Congratulations, Operator. All CTF levels completed.', 'output-success');
            ctfActive = false;
            currentCtfLevel = 0;
            return;
        }
        logOutput(`[+] LEVEL ${currentCtfLevel} COMPLETE: ${level.title}`, 'output-success');
        currentCtfLevel++;
        loadCtfLevelPrompt();
    } else {
        logOutput('[-] ANSWER REJECTED. Review the clue and try again, or type "hint" for guidance.', 'output-error');
    }
}

// 8. INTERACTIVE STAGGERED NETWORK PING ENGINE
function executePingSequence(host) {
    if (!host) {
        logOutput('Usage: ping [hostname_or_ip_target]', 'output-error');
        return;
    }
    systemLocked = true;
    terminalInput.disabled = true;
    logOutput(`PING ${host} (192.168.1.45) 56(84) bytes of data data stream.`);

    let currentSequenceCount = 0;
    const maxPingRuns = 4;

    function runPingLoop() {
        if (currentSequenceCount < maxPingRuns) {
            currentSequenceCount++;
            const randomLatencyMs = (Math.random() * 14 + 4).toFixed(1);
            logOutput(`64 bytes from ${host} (192.168.1.45): icmp_seq=${currentSequenceCount} ttl=64 time=${randomLatencyMs} ms`, 'text-main');
            setTimeout(runPingLoop, 800);
        } else {
            logOutput(`--- ${host} ping statistics ---`, 'output-info');
            logOutput(`${maxPingRuns} packets transmitted, ${maxPingRuns} received, 0% packet loss, time 2404ms`, 'output-info');
            logOutput('rtt min/avg/max/mdev = 4.2/11.5/18.4/3.1 ms', 'output-info');
            systemLocked = false;
            terminalInput.disabled = false;
            terminalInput.focus();
        }
    }
    setTimeout(runPingLoop, 800);
}

// 9. PROGRESS METER UTILITY DRIVER (FIREWALL EXPLOIT GAME)
function runNetworkLoadingSequence() {
    systemLocked = true;
    terminalInput.disabled = true;
    logOutput('[!] INITIALISING FIREWALL EXPLOITATION VECTOR...', 'output-secret');
    logOutput('Connecting to remote target proxy gateway...', 'output-info');

    setTimeout(() => {
        const progressLineElement = logOutput('[--------------------] 0%');
        let currentProgressWidth = 0;
        const totalTargetSteps = 20;

        const progressIntervalTimer = setInterval(() => {
            currentProgressWidth++;
            const computedPercentage = Math.round((currentProgressWidth / totalTargetSteps) * 100);

            const completedBlocks = '#'.repeat(currentProgressWidth);
            const remainingDashes = '-'.repeat(totalTargetSteps - currentProgressWidth);

            progressLineElement.textContent = `[${completedBlocks}${remainingDashes}] ${computedPercentage}%`;
            progressLineElement.className = 'output-secret';
            document.getElementById('terminal').scrollTop = document.getElementById('terminal-output').scrollHeight;

            if (currentProgressWidth >= totalTargetSteps) {
                clearInterval(progressIntervalTimer);
                triggerPostLoadAlerts();
            }
        }, 120);
    }, 800);
}

function triggerPostLoadAlerts() {
    logOutput('[+] INTRUSION PIPELINE ESTABLISHED SUCCESSFULLY.', 'output-success');
    const alertBanner = logOutput('!!! BYPASSING MULTI-FACTOR PERMISSIONS CORE !!!', 'output-error');

    let flashCount = 0;
    const flashInterval = setInterval(() => {
        alertBanner.style.visibility = (alertBanner.style.visibility === 'hidden') ? 'visible' : 'hidden';
        flashCount++;
        if (flashCount >= 6) {
            clearInterval(flashInterval);
            alertBanner.style.visibility = 'visible';

            gameActive = true;
            hackActive = true;
            hackStage = 1;
            hackFailedAttempts = 0;
            systemLocked = false;
            terminalInput.disabled = false;

            logOutput('----------------------------------------------------');
            logOutput('Target security layer compromised. Initiating staged exploit sequence.', 'output-info');
            logOutput('Stage 1: Reconnaissance & Enumeration - type "scan" to enumerate exposed services.', 'output-info');
            terminalInput.focus();
        }
    }, 200);
}

function handleGameInput(input) {
    const command = input.trim().toLowerCase();
    if (!command) return;

    if (command === 'exit') {
        logOutput('[!] Exiting exploit simulation.', 'output-info');
        gameActive = false;
        hackActive = false;
        hackStage = 0;
        return;
    }

    if (command === 'hint') {
        switch (hackStage) {
            case 1:
                logOutput('Hint: Start with reconnaissance. Find open services first.', 'output-info');
                break;
            case 2:
                logOutput('Hint: The target is vulnerable on SSH. Choose the exploit path carefully.', 'output-info');
                break;
            case 3:
                logOutput('Hint: You need a foothold shell before persistence.', 'output-info');
                break;
            case 4:
                logOutput('Hint: Deploy the beacon, then bypass the defender.', 'output-info');
                break;
            case 5:
                logOutput('Hint: Escalation starts with local discovery tools.', 'output-info');
                break;
            default:
                logOutput('Hint: Progress through the stages sequentially.', 'output-info');
        }
        return;
    }

    if (!hackActive) {
        logOutput('[-] No active exploit simulation. Type "hack" to launch the game.', 'output-error');
        return;
    }

    switch (hackStage) {
        case 1:
            if (command === 'scan') {
                logOutput('Scanning perimeter services...', 'output-info');
                logOutput('22/tcp open ssh', 'text-main');
                logOutput('80/tcp open http', 'text-main');
                logOutput('443/tcp open https', 'text-main');
                logOutput('3306/tcp open mysql', 'text-main');
                logOutput('Stage 1 complete. Stage 2: Initial Access - type "exploit ssh".', 'output-success');
                hackStage = 2;
            } else {
                logOutput('[-] Invalid action. Use "scan" to enumerate the target perimeter.', 'output-error');
            }
            break;

        case 2:
            if (command === 'exploit ssh') {
                logOutput('Launching SSH exploit vector...', 'output-info');
                logOutput('Payload delivered, initial access achieved.', 'output-success');
                logOutput('Stage 2 complete. Stage 3: Persistence & Evasion. Type "deploy beacon".', 'output-success');
                hackStage = 3;
            } else if (command.startsWith('exploit')) {
                logOutput('[-] That exploit path failed. Try "exploit ssh".', 'output-error');
            } else {
                logOutput('[-] No valid exploit command detected.', 'output-error');
            }
            break;

        case 3:
            if (command === 'deploy beacon') {
                logOutput('Deploying C2 beacon and hiding traffic using basic evasion.', 'output-info');
                logOutput('Beacon established, Defender heuristics bypassed.', 'output-success');
                logOutput('Stage 3 complete. Stage 4: Privilege Escalation. Type "run winpeas".', 'output-success');
                hackStage = 4;
            } else {
                logOutput('[-] The beacon was not deployed. Use "deploy beacon" to persist.', 'output-error');
            }
            break;

        case 4:
            if (command === 'run winpeas') {
                logOutput('Executing local escalation enumeration...', 'output-info');
                logOutput('Found protected file path: C:\\ProgramData\\Secrets\\database_creds.json', 'text-main');
                logOutput('Stage 4 complete. Stage 5: Exfiltration. Type "exfiltrate database_creds.json".', 'output-success');
                hackStage = 5;
            } else {
                logOutput('[-] No privilege escalation scan found. Use "run winpeas".', 'output-error');
            }
            break;

        case 5:
            if (command === 'exfiltrate database_creds.json') {
                logOutput('Extracting target file from protected system directory...', 'output-info');
                logOutput('FILE CONTENTS: {"db_user":"svc_admin","db_pass":"P@ssw0rd!2026","host":"127.0.0.1"}', 'output-success');
                logOutput('[+] Exfiltration complete. Mission objective achieved.', 'output-success');
                gameActive = false;
                hackActive = false;
                hackStage = 0;
            } else {
                logOutput('[-] Invalid exfiltration command. Use "exfiltrate database_creds.json".', 'output-error');
            }
            break;

        default:
            logOutput('[-] Unexpected exploit state. Type "exit" and restart the mission.', 'output-error');
            hackActive = false;
            gameActive = false;
            hackStage = 0;
    }
}

// COLLAPSIBLE TOGGLE FUNCTIONALITY (for collapsible-gallery sections)
function toggleCollapsible(button) {
    const content = button.nextElementSibling;
    if (content) {
        content.classList.toggle('collapsed');
        button.classList.toggle('collapsed');
    }
}

// GALLERY TOGGLE FUNCTIONALITY
function toggleGallery() {
    const content = document.getElementById('gallery-content');
    const toggle = document.querySelector('.gallery-toggle');

    content.classList.toggle('collapsed');
    toggle.classList.toggle('collapsed');
}

// IMAGE MODAL: click to zoom and close
function openImageModal(src, alt) {
    const modal = document.getElementById('img-modal');
    const modalImg = document.getElementById('img-modal-img');
    const caption = document.getElementById('img-modal-caption');
    modalImg.src = src;
    modalImg.alt = alt;
    caption.textContent = alt || '';
    modal.setAttribute('aria-hidden', 'false');
}

function closeImageModal() {
    const modal = document.getElementById('img-modal');
    const modalImg = document.getElementById('img-modal-img');
    modalImg.src = '';
    modal.setAttribute('aria-hidden', 'true');
}

document.addEventListener('DOMContentLoaded', () => {
    // Image click handler
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('.tool-img, .gallery-img')) {
            openImageModal(target.src, target.alt || 'Preview');
        }
    });

    // Close button and background click handler
    document.addEventListener('click', (e) => {
        if (e.target.matches('.img-modal-close')) closeImageModal();
        if (e.target.matches('.img-modal')) closeImageModal();
    });

    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageModal();
            closeReportModal();
        }
    });
});
