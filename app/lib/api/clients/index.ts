import { Client } from "@/app/type/client";

export const getclients = async () => {
    const res = await fetch('/api/clients');
    if (!res.ok) {
        throw new Error('Failed to fetch clients');
    }
    return res.json();
}

export const createClient = async (clientData: Client) => {
    return await fetch('/api/clients', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
    });

}

export const updateClient = async (clientData: Client) => {
    const res = await fetch(`/api/clients/${clientData.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
    });
    if (!res.ok) {
        throw new Error('Failed to update client');
    }
    return res.json();
}

export const deleteClient = async (clientId: string) => {
    const res = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: clientId })
      
    });
    if (!res.ok) {
        throw new Error('Failed to delete client');
    }
    return res.json();
}