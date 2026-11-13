import { NextResponse } from "next/server";
import { getValidToken } from "@/app/lib/helper";

export async function GET(req: Request) {
    const token = await getValidToken();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestUrl = new URL(req.url);
    const queryString = requestUrl.searchParams.toString();

    const clients = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/client${queryString ? `?${queryString}` : ''}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    const clientsData = await clients.json().catch(() => null);
    // Se reenvía el status real (ej. 403 cuando el usuario no tiene
    // sucursales asignadas) para que la pantalla muestre el `detail`.
    return NextResponse.json(clientsData, { status: clients.status });
}

export async function POST(req: Request) {
    const token = await getValidToken();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();

    const newClient = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/client`, {
        method: 'POST', 
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }); 

    if (!newClient.ok) {
        const errorData = await newClient.json();
        console.error('Error creating client:', errorData);
        return NextResponse.json(errorData, { status: newClient.status });
    }

    const clientData = await newClient.json();
    return NextResponse.json(clientData);
}

export async function DELETE(req: Request) {
     const token = await getValidToken();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/client/${body.id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) {
        const errorData = await res.json();
        return NextResponse.json({ error: errorData.detail || 'Failed to delete client' }, { status: res.status });
    }
    return NextResponse.json({ message: 'Client deleted successfully' });
}