import { defineStore } from 'pinia';
import selfHostedApi, { SelfHostedServer } from '../api/selfHosted';

export const useServerStore = defineStore('server', {
  state: () => ({
    servers: [] as SelfHostedServer[],
    loading: false,
    error: '' as string | null
  }),
  actions: {
    async fetchServers() {
      this.loading = true;
      try {
        const response = await selfHostedApi.getServers();
        this.servers = response.data;
      } catch (error) {
        this.error = 'Erreur lors du chargement des serveurs';
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
    async addServer(domain: string, ip?: string, config?: any) {
      try {
        const response = await selfHostedApi.addServer({ domain, ip, config });
        this.servers.push(response.data as SelfHostedServer);
      } catch (error) {
        this.error = 'Erreur lors de la création du serveur';
        console.error(error);
      }
    },
    async updateServer(serverId: number, payload: { domain?: string; ip?: string; config?: any }) {
      try {
        const response = await selfHostedApi.updateServer(serverId, payload);
        const index = this.servers.findIndex(s => s.id === serverId);
        if (index !== -1) this.servers[index] = response.data as SelfHostedServer;
      } catch (error) {
        this.error = 'Erreur lors de la mise à jour du serveur';
        console.error(error);
      }
    },
    async deleteServer(serverId: number) {
      try {
        await selfHostedApi.deleteServer(serverId);
        this.servers = this.servers.filter(s => s.id !== serverId);
      } catch (error) {
        this.error = 'Erreur lors de la suppression du serveur';
        console.error(error);
      }
    }
  }
});
