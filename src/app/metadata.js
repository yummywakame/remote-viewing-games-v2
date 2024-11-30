export const generateMetadata = () => {
  return {
    metadataBase: new URL('https://mindsight.yummy-wakame.com'),
    title: 'MindSight Games',
    description: 'Practice Mind Sight blindfolded with your AI play partner!',
    openGraph: {
      title: 'MindSight Games',
      description: 'Practice Mind Sight blindfolded with your AI play partner!',
      url: 'https://mindsight.yummy-wakame.com',
      type: 'website',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'MindSight Games - Practice with your AI play partner!',
        },
      ],
    },
    facebook: {
      appId: '452955081243065',
    },
  }
}