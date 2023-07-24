import 'styles/globals.css';
import 'react-datepicker/dist/react-datepicker.css';
import type { AppProps } from 'next/app';
import { RoqProvider, ChatProvider } from '@roq/nextjs';
import { clientConfig } from 'config';
import '@roq/nextjs/index.css';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { roqThemeLight } from 'styles/roq-theme';
import Script from 'next/script';

export default function App({ Component, pageProps }: AppProps) {
  const theme = extendTheme({
    colors: {
      primary: { 500: '#108a00' },
    },
  });
  return (
    <ChakraProvider theme={theme}>
      {/* start tracking-scripts */}
      {/* end tracking-scripts */}
      <RoqProvider
        config={{
          host: clientConfig.roq.platformURL,
          auth: {
            useRoqAuth: true,
          },
        }}
        theme={roqThemeLight}
      >
        <ChatProvider>
          <Component {...pageProps} />
        </ChatProvider>
      </RoqProvider>
    </ChakraProvider>
  );
}
