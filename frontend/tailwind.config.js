export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Здесь мы добавим цвета из вашего Laravel проекта
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
      },
      // Другие настройки темы
    },
  },
  plugins: [],
};
