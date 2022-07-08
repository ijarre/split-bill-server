import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { generateSlug } from "random-word-slugs";

const prisma = new PrismaClient();

export const createTransaction = async (req: Request, res: Response) => {
  const { user_id } = req.body;
  const slug = generateSlug();
  if (typeof user_id === "string") res.status(403).json({ error: "wrong input" });
  const transaction = await prisma.transaction.create({
    data: {
      slug,
      User: {
        connect: {
          user_id,
        },
      },
    },
    include: {
      Item: true,
      User: true,
    },
  });
  res.status(200).json(transaction);
};

export const addUserToTransaction = async (req: Request, res: Response) => {
  const { user_id, transaction_id } = req.body;

  const trx = await prisma.transaction.findUnique({
    where: {
      transaction_id,
    },
    include: {
      User: true,
    },
  });
  if (trx) {
    if (trx.User.filter((el) => el.user_id === user_id).length === 0) {
      const addUser = await prisma.transaction.update({
        where: {
          transaction_id,
        },
        data: {
          User: {
            connect: {
              user_id,
            },
          },
        },
        include: {
          User: true,
        },
      });

      res.status(200).json({ data: addUser, message: "success adding member to transaction" });
    } else {
      res.status(403).json({ error: "user is already in transaction" });
    }
  } else {
    res.status(403).json({ error: "cannot find transaction" });
  }
};
export const addItemToTransaction = async (req: Request, res: Response) => {
  const { item_id, transaction_id, item_name, item_price } = req.body;
  if (!transaction_id) {
    res.status(403).json({ error: "transaction id is required" });
    return;
  }
  if (item_name && item_price) {
    const trx = await prisma.transaction.update({
      where: {
        transaction_id,
      },
      data: {
        Item: {
          create: {
            item_name,
            item_price,
          },
        },
      },
      select: {
        Item: {
          select: {
            item_name: true,
            item_price: true,
          },
        },
      },
    });

    res.status(200).json({ message: "success create item to transaction", data: trx });
  } else {
    if (!item_id) {
      res.status(403).json({ error: "item_id or (item_name and item_price) is required" });
      return;
    } else {
      const trx = await prisma.transaction.update({
        where: {
          transaction_id,
        },
        data: {
          Item: {
            connect: {
              item_id,
            },
          },
        },
      });
      res.status(200).json({ message: "success adding item to transaction", data: trx });
    }
  }
};

export const getAllTransaction = async (_: Request, res: Response) => {
  const allTransaction = await prisma.transaction.findMany({
    include: {
      User: true,
      Item: true,
    },
  });
  res.send(allTransaction);
};

export const getUserItemInTransaction = async (req: Request, res: Response) => {
  const { transaction_id, user_id } = req.body;
  const result = await prisma.transaction.findUnique({
    where: {
      transaction_id,
    },
    select: {
      Item: {
        select: {
          UserItem: {
            where: {
              user_id,
            },
          },
        },
      },
    },
  });
  res.status(200).json({ data: result });
};

export const getItemInTransaction = async (req: Request, res: Response) => {
  const { transaction_id } = req.body;

  const transaction = await prisma.transaction.findUnique({
    where: {
      transaction_id,
    },
    select: {
      transaction_id: true,
      slug: true,
      Item: true,
    },
  });
  res.status(200).json({ data: transaction });
};
