import Head from 'next/head';
import VideoUpload from '../components/VideoUpload';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Bangla Insight Hub</title>
        <meta name="description" content="AI-powered video analysis in Bangla" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Bangla Insight Hub</h1>
          <p className={styles.description}>
            Upload your videos to get AI-powered insights in Bangla
          </p>
        </div>

        <div className={styles.content}>
          <VideoUpload />
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Powered by Google Gemini AI</p>
      </footer>
    </div>
  );
}
