import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'global' }
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'global' }
      });
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des paramètres.' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { interestRate, welcomeBonus, minDeposit, maintenanceMode } = req.body;

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'global' },
      update: {
        interestRate: interestRate !== undefined ? parseFloat(interestRate) : undefined,
        welcomeBonus: welcomeBonus !== undefined ? parseFloat(welcomeBonus) : undefined,
        minDeposit: minDeposit !== undefined ? parseFloat(minDeposit) : undefined,
        maintenanceMode: maintenanceMode !== undefined ? !!maintenanceMode : undefined,
      },
      create: {
        id: 'global',
        interestRate: interestRate !== undefined ? parseFloat(interestRate) : 0.03,
        welcomeBonus: welcomeBonus !== undefined ? parseFloat(welcomeBonus) : 80.0,
        minDeposit: minDeposit !== undefined ? parseFloat(minDeposit) : 20.0,
        maintenanceMode: maintenanceMode !== undefined ? !!maintenanceMode : false,
      }
    });

    res.status(200).json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des paramètres.' });
  }
};
