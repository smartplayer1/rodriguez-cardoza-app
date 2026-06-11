import {NextResponse} from 'next/server';
import { getValidToken } from '@/app/lib/helper';


export async function GET() {
    const token = await getValidToken();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simulate fetching bank accounts from a database
    const bankAccounts = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account-bank`, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!bankAccounts.ok) {
        const errorData = await bankAccounts.json();
        return NextResponse.json({ error: errorData.detail || 'Failed to fetch bank accounts' }, { status: bankAccounts.status });
    }

    const bankAccountsData = await bankAccounts.json();

    return NextResponse.json(bankAccountsData );
}

export async function POST(req: Request) {
     const token = await getValidToken();

    if (!token) {
        return NextResponse.json(
            { message: 'No autorizado' },
            { status: 401 }
        );
    }
    const body = await req.json(); 
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account-bank`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorData = await res.json();
        return NextResponse.json({ message: errorData.detail || 'Error al crear cuenta bancaria' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
}   

export async function PUT(req: Request) {
    const token = await getValidToken()

    if (!token) {
        return NextResponse.json(
            { message: 'No autorizado' },
            { status: 401 }
        );
    }
    const body = await req.json();

    const { id, account, description, bankId } = body;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account-bank/${id}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accountNumber: account, description, bankId })
    });

    if (!res.ok) {
        const errorData = await res.json();
        console.log('PUT error data:', errorData); // Debug log para verificar los datos de error
        return NextResponse.json({ message: errorData.detail || 'Error al actualizar cuenta bancaria' }, { status: res.status });
    }

    return NextResponse.json({ message: 'Cuenta bancaria actualizada correctamente' });
}

export async function DELETE(req: Request) {
    const token = await getValidToken()

    if (!token) {
        return NextResponse.json(
            { message: 'No autorizado' },
            { status: 401 }
        );
    }
    const { id } = await req.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/account-bank/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!res.ok) {
        const errorData = await res.json();
        return NextResponse.json({ message: errorData.detail || 'Error al eliminar cuenta bancaria' }, { status: res.status });
    }

    return NextResponse.json({ message: 'Cuenta bancaria eliminada correctamente' });
}
