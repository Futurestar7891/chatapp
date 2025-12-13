
import styles from "../../Modules/About.module.css";
import React from "react";

const About = () => {

  return (
    <section className={styles.aboutSection}>
      <div className={styles.wrapper}>
        {/* LEFT COLUMN */}
        <div className={styles.leftColumn}>
          {/* ABOUT ME */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>About Me</h2>
            <p className={styles.cardText}>
              Hi, I'm <span className={styles.highlight}>Gajanand Mali</span>, a
              passionate{" "}
              <span className={styles.highlight}>Full-Stack Developer</span>
              specializing in MERN stack. I enjoy building scalable, real-world
              applications and writing clean, efficient code.
            </p>

            <p className={styles.cardText}>
              I’m a{" "}
              <span className={styles.highlight}>B.Tech CSE (2021–2025)</span>
              graduate with strong fundamentals in
              <span className={styles.highlight}>
                {" "}
                DSA, JavaScript, React, Node.js, Express, MongoDB.
              </span>
            </p>
          </div>

          {/* EXPERIENCE */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Experience</h2>
            <div className={styles.expItem}>
              <h3 className={styles.expRole}>Frontend Developer Intern</h3>
              <p className={styles.expCompany}>
                CODRU Education (May–July 2024)
              </p>
              <p className={styles.expDesc}>
                Built an interactive educational blog forum using React.js with
                real-time discussions, Pub/Sub integration & seamless API
                collaboration.
              </p>
            </div>
          </div>

          {/* CODING PROFILES */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Coding Profiles</h2>

            <ul className={styles.linkList}>
              <li>
                <a
                  href="https://leetcode.com/u/RandomProgrammerGk/"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.link}
                >
                  LeetCode
                </a>
              </li>
              <li>
                <a
                  href="https://www.geeksforgeeks.org/user/gkmal3frg/"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.link}
                >
                  GeeksforGeeks
                </a>
              </li>
              <li>
                <a
                  href="https://www.naukri.com/code360/profile/Nobisuke"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.link}
                >
                  Coding Ninjas
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightColumn}>
          {/* SKILLS */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Tech Skills</h2>
            <div className={styles.chipContainer}>
              <span className={styles.chip}>JavaScript</span>
              <span className={styles.chip}>TypeScript</span>
              <span className={styles.chip}>C++</span>
              <span className={styles.chip}>React.js</span>
              <span className={styles.chip}>Node.js</span>
              <span className={styles.chip}>Express.js</span>
              <span className={styles.chip}>MongoDB</span>
              <span className={styles.chip}>React Native</span>
              <span className={styles.chip}>Socket.IO</span>
              <span className={styles.chip}>Tailwind CSS</span>
              <span className={styles.chip}>BootStrap</span>
              <span className={styles.chip}>Stripe</span>
            </div>
          </div>

          {/* PROJECTS */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Highlighted Projects</h2>

            <div className={styles.projectBox}>
              <h4 className={styles.projectTitle}>
                <a
                  href="https://drive.usercontent.google.com/download?id=1OuDn8oq43GRT3fj7hK2GPA6idzu3yc10&export=download&authuser=0"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.projectLink}
                >
                  Expense Tracker App ↗
                </a>
              </h4>
              <p className={styles.projectDesc}>
                Cross-platform app with JWT auth, email verification, analytics
                & smooth UX (React Native + Node).
              </p>
            </div>

            <div className={styles.projectBox}>
              <h4 className={styles.projectTitle}>
                <a
                  href="https://shopx-omega.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.projectLink}
                >
                  E-Commerce ↗
                </a>
              </h4>
              <p className={styles.projectDesc}>
                Real-time chat, seen status, Cloudinary uploads, JWT auth,
                responsive UI using MERN + Socket.IO.
              </p>
            </div>
          </div>

          {/* SOCIAL LINKS */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Connect With Me</h2>

            <div className={styles.linksRow}>
              <a
                href="https://github.com/Futurestar7891"
                className={styles.primaryBtn}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>

              <a
                href="https://linkedin.com/in/gajanand-mali-100ab0265"
                className={styles.secondaryBtn}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>

              <a
                href="https://wa.me/916377813239"
                className={styles.secondaryBtn}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              <a
                href="mailto:your-email@example.com"
                className={styles.secondaryBtn}
                target="_blank"
                rel="noreferrer"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(About);
