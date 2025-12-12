import { AppPlugin } from '@grafana/data';

import { AppConfig } from './components/AppConfig';
import { CopilotProvider } from './components/Copilot/CopilotProvider';
import { MainPage } from './pages';

export const plugin = new AppPlugin<{}>()
  .setRootPage(MainPage)
  .addConfigPage({
    title: 'Configuration',
    icon: 'cog',
    body: AppConfig,
    id: 'configuration',
  })
  .addComponent({
    title: 'Grafana Copilot',
    description: 'Floating Grafana Copilot chat drawer',
    targets: 'grafana/app/chrome/v1',
    component: CopilotProvider,
  })
  .exposeComponent({
    id: 'grafana-llm-app/copilot/v1',
    title: 'Grafana Copilot',
    description: 'Floating Grafana Copilot chat drawer',
    component: CopilotProvider,
  });
