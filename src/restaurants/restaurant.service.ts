import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateRestaurantDto,
  CreateRestaurantOutputDto,
} from './dtos/create-restaurant.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EditRestaurantDto,
  EditRestaurantOutputDto,
} from './dtos/edit-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import { Category } from './entities/category.entity';
import { DeleteRestaurantDto } from './dtos/delete-restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(
    private readonly categories: CategoryRepository,
    @InjectRepository(Restaurant)
    private readonly restaurant: Repository<Restaurant>,
  ) {}

  async createRestaurant(
    user: User,
    restaurant: CreateRestaurantDto,
  ): Promise<CreateRestaurantOutputDto> {
    try {
      const newRestaurant = this.restaurant.create(restaurant);
      newRestaurant.owner = user;

      newRestaurant.category = await this.categories.getOrCreateCategory(
        restaurant.categoryName,
      );
      await this.restaurant.save(newRestaurant);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        error: e,
        ok: false,
      };
    }
  }

  async editRestaurant(
    owner: User,
    input: EditRestaurantDto,
  ): Promise<EditRestaurantOutputDto> {
    try {
      const restaurant = await this.restaurant.findOneOrFail(
        input.restaurantId,
        {
          loadRelationIds: false,
        },
      );
      if (!restaurant) return { ok: false, error: 'Restaurant Not Found !' };
      if (owner.id.toString() !== restaurant.ownerId.toString())
        return {
          ok: false,
          error: 'Its non of your business',
        };
      let category: Category = null;
      if (input.categoryName)
        category = await this.categories.getOrCreateCategory(
          input.categoryName,
        );
      await this.restaurant.save([
        {
          id: input.restaurantId,
          ...input,
          ...(category && { category }),
        },
      ]);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    input: DeleteRestaurantDto,
  ): Promise<EditRestaurantOutputDto> {
    try {
      const restaurant = await this.restaurant.findOneOrFail(
        input.restaurantId,
      );
      if (!restaurant) return { ok: false, error: 'Restaurant Not Found !' };
      if (owner.id.toString() !== restaurant.ownerId.toString())
        return {
          ok: false,
          error: 'Its non of your business',
        };
      await this.restaurant.save([
        {
          id: input.restaurantId,
          verified: false,
        },
      ]);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: true,
        error,
      };
    }
  }

  async allCategories() {
    return this.categories.find({});
  }

  countRestaurants(category: Category) {
    return this.restaurant.count({ category });
  }
}